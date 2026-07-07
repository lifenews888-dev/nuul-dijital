export type RegistrarRegistrant = {
  type: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  businessRegNumber?: string | null;
};

export type RegistrarRegisterInput = {
  orderId: string;
  orderNumber: string;
  domainName: string;
  years: number;
  registrant: RegistrarRegistrant;
};

export type RegistrarRegisterSuccess = {
  ok: true;
  registrarName: string;
  registrarOrderId: string;
  expiresAt?: Date;
  pending?: boolean;
};

export type RegistrarRegisterFailure = {
  ok: false;
  code: string;
  message: string;
  retryable?: boolean;
};

export type RegistrarRegisterResult = RegistrarRegisterSuccess | RegistrarRegisterFailure;

export interface RegistrarProvider {
  readonly id: string;
  readonly label: string;
  readonly supportsAutoRegister: boolean;
  register(input: RegistrarRegisterInput): Promise<RegistrarRegisterResult>;
}