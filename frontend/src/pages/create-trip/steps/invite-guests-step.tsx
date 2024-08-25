import { ArrowRight, UserRoundPlus } from "lucide-react";
import { Button } from "../../../components/button";

interface InviteGuestsStepProps {
  emailsToInvite: string[]
  openGuestsModal: () => void
  openConfirmTripModal: () => void
}

export function InviteGuestsStep({
  emailsToInvite,
  openGuestsModal,
  openConfirmTripModal
}: InviteGuestsStepProps) {
  return (
    <div className="h-16 bg-zinc-900 px-4 rounded-xl flex items-center shadow-shape gap-3">
      <button onClick={openGuestsModal} type="button" className='flex gap-2 items-center flex-1'>
        <UserRoundPlus className='size-5 text-zinc-400' />
        { emailsToInvite.length > 0 ? (
          <span className='text-zinc-100'>
            {emailsToInvite.length} people invited
          </span>
        ) : <span className='text-lg text-zinc-400 outline-none left-0'>Quem estará na viagem?</span> }
      </button>

      <div className='w-px h-6 bg-zinc-800' />

      <Button onClick={openConfirmTripModal}>
        Confirm trip
        <ArrowRight className='size-5' />
      </Button>
    </div>
  )
}