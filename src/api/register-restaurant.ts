import { api } from '@/lib/axios'

export interface RegisterRestaurantRequest {
  restaurantName: string
  managerName: string
  address: string
  email: string
  phone: string
}

export async function RegisterRestaurant({
  restaurantName,
  managerName,
  address,
  email,
  phone,
}: RegisterRestaurantRequest) {
  await api.post('/restaurants', { restaurantName, managerName, email, phone, address})
}
