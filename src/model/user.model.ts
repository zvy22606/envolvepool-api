export enum RegisterTypeEnums {
  register = 'register',
  whitelist = 'whitelist'
}

export interface ThirdUserDto {
  type: string
  email?: string
  name?: string
  nickname: string
  avatarUrl?: string
}
