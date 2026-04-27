import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token')
      if (typeof window !== 'undefined') {
        window.alert('Unauthorized (401): your session may have expired.')
      }
    }
    return Promise.reject(error)
  },
)

function normalizeApiError(error) {
  // Debugging help for 400/validation/business-rule failures
  // eslint-disable-next-line no-console
  console.log(error?.response?.data)

  const status = error?.response?.status
  const data = error?.response?.data
  const message =
    (typeof data === 'string' && data) ||
    data?.message ||
    data?.error ||
    error?.message ||
    'Request failed'

  const err = new Error(message)
  err.status = status
  err.data = data
  return err
}

function normalizeCustomerPayload(customer) {
  const status =
    customer?.status == null
      ? undefined
      : String(customer.status).trim().toUpperCase()

  // Send only what a typical Spring DTO expects
  return {
    name: customer?.name?.trim?.() ?? customer?.name,
    email: customer?.email?.trim?.() ?? customer?.email,
    phone: customer?.phone?.trim?.() ?? customer?.phone,
    status,
  }
}

export async function getCustomers(page = 0, size = 10) {
  try {
    const res = await api.get('/customers', {
      params: { page, size },
    })
    return res.data
  } catch (e) {
    throw normalizeApiError(e)
  }
}

export async function loginUser(username, password) {
  try {
    const res = await api.post('/auth/login', {
      username,
      password,
    })
    return res
  } catch (e) {
    throw normalizeApiError(e)
  }
}

export async function addCustomer(customer) {
  try {
    const res = await api.post('/customers', normalizeCustomerPayload(customer))
    return res.data
  } catch (e) {
    throw normalizeApiError(e)
  }
}

export async function updateCustomer(id, data) {
  try {
    const res = await api.put(`/customers/${id}`, normalizeCustomerPayload(data))
    return res.data
  } catch (e) {
    throw normalizeApiError(e)
  }
}

export async function deleteCustomer(id) {
  try {
    const res = await api.delete(`/customers/${id}`)
    return res.data
  } catch (e) {
    throw normalizeApiError(e)
  }
}

export async function addTicket(ticket) {
  try {
    const res = await api.post('/tickets', ticket)
    return res.data
  } catch (e) {
    throw normalizeApiError(e)
  }
}

