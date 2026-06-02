import { DomainError } from './domain-error'

export class ServiceUnavailableError extends DomainError {
  constructor(message: string) {
    super(message, 503, 'SERVICE_UNAVAILABLE')
  }
}
