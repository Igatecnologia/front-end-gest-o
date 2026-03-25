import { SGBR_BI_ACTIVE, SGBR_BI_HTTP_BASE } from '../api/apiEnv'
import { createAuthorizedAxios } from '../api/axiosWithAuth'

/** Cliente para `/sgbrbi/*` quando a integração está ativa (URL ou `proxy` em dev). */
export const sgbrBiHttp = SGBR_BI_ACTIVE ? createAuthorizedAxios(SGBR_BI_HTTP_BASE) : null
