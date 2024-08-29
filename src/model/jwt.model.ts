export interface UserTokenInfo {
  id: string
  email?: string | null
  name?: string | null
  type?: ConfirmationType
  long?: boolean
}

export enum ConfirmationType {
  SIGNUP = 'signup',
  PASSWORD = 'password'
}
