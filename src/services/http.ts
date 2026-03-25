import { API_BASE_URL } from '../api/apiEnv'
import { createAuthorizedAxios } from '../api/axiosWithAuth'

export const http = createAuthorizedAxios(API_BASE_URL)

