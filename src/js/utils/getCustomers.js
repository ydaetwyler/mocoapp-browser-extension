import axios from 'axios'

const getCustomers = () => axios.get('https://www.erp-mapping.previon.net/public/api/customers')

export const allCustomers = getCustomers().then(response => response.data)