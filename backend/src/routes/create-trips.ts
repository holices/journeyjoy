import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import nodemailer from 'nodemailer';
import z from "zod";
import { dayjs } from "../lib/dayjs";
import { getMailClient } from "../lib/mail";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client.error";
import { env } from "../env";

export async function createTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips', {
    schema: {
      body: z.object({
        destination: z.string().min(4),
        starts_at: z.coerce.date(),
        ends_at: z.coerce.date(),
        owner_name: z.string(),
        owner_email: z.string().email(),
        emails_to_invite: z.array(z.string().email())
      })
    }
  }, async (request) => {
    const { destination, starts_at, ends_at, owner_name, owner_email, emails_to_invite } = request.body
    const differenceInMilliseconds = ends_at.getTime() - starts_at.getTime();
    const millisecondsInOneDay = 1000 * 60 * 60 * 24;
    const differenceInDays = differenceInMilliseconds / millisecondsInOneDay;

    if (differenceInDays > 90) {
      throw new ClientError("A data não pode ser superior a 90 dias");
    }

    if (dayjs(starts_at).isBefore(new Date())) {
      throw new ClientError('Invalid trip start daaate')
    }

    if (dayjs(ends_at).isBefore(starts_at)) {
      throw new ClientError('The end date cannot be earlier than the start date')
    }

    const trip = await prisma.trip.create({
      data: {
        destination,
        starts_at,
        ends_at,
        participants: {
          createMany: {
            data: [
              {
                name: owner_name,
                email: owner_email,
                is_owner: true,
                is_confirmed: true, 
              },
              ...emails_to_invite.map(email => {
                return { email }
              })
            ]
          }
        }
      }
    })

    const formattedStartDate = dayjs(starts_at).format('LL')
    const formattedEndDate = dayjs(ends_at).format('LL')

    const confirmationLink = `${env.API_BASE_URL}/trips/${trip.id}/confirm`

    const mail = await getMailClient()

    const message = await mail.sendMail({
      from: {
        name: 'Equipe Journey Joy',
        address: 'oi@journeyjoy'
      },

      to: {
        name: owner_name,
        address: owner_email,
      },

      subject: `Confirme sua viagem para ${destination} em ${formattedStartDate}`,
      html: `
      <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
        <p>Você solicitou a criação de uma viagem para <strong>${destination}</strong> nas datas entre <strong>${formattedStartDate}</strong> à <strong>${formattedEndDate}</strong>.</p>
        <p></p>
        <p>Para confirmar sua viagem, clique no link abaixo:</p>
        <p></p>
        <p>
          <a href="${confirmationLink}">Confirmar viagem</a>
        </p>
        <p></p>
        <p>Caso você não saiba do que se trata esse e-mail, ignore-o.</p>
      </div>
    `.trim()
    })

    console.log(nodemailer.getTestMessageUrl(message))

    return { tripId: trip.id }
  })
}