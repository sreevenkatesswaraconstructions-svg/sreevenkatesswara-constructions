export const company = {
  name: 'Sree Venkatesswara Constructions & Interiors',
  tagline: 'Building Dreams. Creating Spaces.',
  primaryPhone: '9052468789',
  secondaryPhone: '8977068789',
  whatsapp: '9052468789',
  email: 'sreevenkatesswaraconstructions@gmail.com',
  instagram: 'https://www.instagram.com/sreevenkatesswaraconstructions',
  website: 'https://www.sreevenkatesswaraconstructions.com',
  address: '50-58-8, Rajendranagar, Backside of Prism College, Seethammadhara, Visakhapatnam – 530016',
  whatsappMessage: 'Hello, I would like to know more about your construction services.',
}

export const getCallUrl = (phone = company.primaryPhone) => `tel:${phone}`

export const getWhatsAppUrl = (phone = company.whatsapp, message = company.whatsappMessage) => {
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/91${phone}${encodedMessage ? `?text=${encodedMessage}` : ''}`
}

export const getEmailUrl = (email = company.email) => `mailto:${email}`

export const getMapsUrl = (address = company.address) => `https://www.google.com/maps?q=${encodeURIComponent(address)}`
