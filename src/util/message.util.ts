export default class MessageUtil {
  public static enterEmailError(): string {
    return `Please enter your valid email`
  }

  public static enterPasswordError(): string {
    return `Two passwords didn't match`
  }

  public static signinWrong(): string {
    return 'Invalid email or password'
  }

  public static passwordWrong(): string {
    return 'Invalid password'
  }

  public static emailNotExists(email: string): string {
    return `${email} not registered`
  }

  public static emailExists(email: string): string {
    return `${email} is registered`
  }

  public static userNotActivated(email: string): string {
    return `Email address ${email} is not verified, please verify your email`
  }

  public static thanksForSigningUp(email: string): string {
    return `Thank you for registering, please verify your email address ${email}`
  }

  public static emailCantConfirmed(): string {
    return `We can' verify your email`
  }

  public static invitorNotFound(): string {
    return `Invitor not found`
  }

  public static forgetPassword(email: string): string {
    return `We have sent you a verification email, please verify your email address ${email}`
  }
}
