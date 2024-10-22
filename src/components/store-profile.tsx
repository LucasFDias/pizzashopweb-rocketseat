import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { subDays } from 'date-fns'
import { DateRange } from 'react-day-picker'

import {
  getManagedRestaurant,
  GetManagedRestaurantResponse,
} from '@/api/get-managed-restaurant'
import { updateProfile } from '@/api/update-profile'

import { Button } from './ui/button'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { DateRangePicker } from './ui/date-range-picker'
import { useState } from 'react'

const storeProfileSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
})

type StoreProfileSchema = z.infer<typeof storeProfileSchema>

export function StoreProfile() {
  const queryClient = useQueryClient()

  const { data: storeProfile, isLoading: isLoadingStoreProfile } = useQuery({
    queryKey: ['managed-restaurant'],
    queryFn: getManagedRestaurant,
    staleTime: Infinity,
  })

  const [period, setPeriod] = useState<DateRange | undefined>({
      from: subDays(new Date(), 7),
      to: new Date(),
  })

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<StoreProfileSchema>({
    resolver: zodResolver(storeProfileSchema),
    values: {
      name: storeProfile?.name ?? '',
      description: storeProfile?.description ?? '',
    },
  })

  function updateProfileDataOnCache({ name, description }: StoreProfileSchema) {
    const cached = queryClient.getQueryData<GetManagedRestaurantResponse>([
      'managed-restaurant',
    ])

    if (cached) {
      queryClient.setQueryData<GetManagedRestaurantResponse>(
        ['managed-restaurant'],
        {
          ...cached,
          name,
          description,
        },
      )
    }

    return { cached }
  }

  const { mutateAsync: updateProfileFn } = useMutation({
    mutationFn: updateProfile,
    onMutate: ({ name, description }) => {
      const { cached } = updateProfileDataOnCache({
        name,
        description,
      })

      return { previousProfile: cached }
    },
    onError(_, __, context) {
      if (context?.previousProfile) {
        updateProfileDataOnCache(context.previousProfile)
      }
    },
  })

  async function handleUpdateProfile({
    name,
    description,
  }: StoreProfileSchema) {
    try {
      await updateProfileFn({
        name,
        description,
      })

      toast.success('Perfil atualizado com sucesso!')
    } catch {
      toast.error('Falha ao atualizar o perfil, tente novamente!')
    }
  }

  return (
    <DialogContent className="sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>Perfil da loja</DialogTitle>
        <DialogDescription>
          Atualize as informações do seu estabelecimento visíveis aos seus
          clientes.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(handleUpdateProfile)}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome :
            </Label>
            <Input
              id="name"
              className="col-span-3"
              disabled={isLoadingStoreProfile}
              {...register('name')}
            />
          </div>
          <div className="grid grid-cols-4 items-baseline gap-4">
            <Label htmlFor="description" className="text-right">
              Descrição :
            </Label>
            <Textarea
              id="description"
              className="col-span-3 min-h-[100px]"
              disabled={isLoadingStoreProfile}
              {...register('description')}
            />
          </div>
          <div className="grid grid-cols-4 items-baseline gap-4">
            <Label htmlFor="hours" className="text-right aligns">
              Horários :
            </Label>
            <DateRangePicker
              id="hours"
              className="col-span-3 min-h-[100px]"
              date={period}
              onDateChange={setPeriod}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="submit"
            variant="success"
            disabled={isLoadingStoreProfile || isSubmitting}
          >
            Salvar
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
