import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { dayjs } from "../lib/dayjs";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client.error";

export async function updateTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    '/trips/:tripId', 
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid()
        }),
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
        })
      }
    },
    async (request) => {
      const { tripId } = request.params
      const {destination, starts_at, ends_at} = request.body

      const trip = await prisma.trip.findUnique({
        where: {id: tripId},
      })

      if (!trip) {
        throw new ClientError('Trip not found')
      }

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

      await prisma.trip.update({
        where: { id: tripId },
        data: {
          destination,
          starts_at,
          ends_at
        }
      })

      return { tripId: trip.id }
    }
  )
}