declare module "mercadopago" {
  interface PreferenceItem {
    id: string;
    title: string;
    description: string;
    unit_price: number;
    quantity: number;
    currency_id: string;
  }

  interface PreferencePaymentMethods {
    excluded_payment_types: Array<{ id: string }>;
    installments: number;
    default_installments?: number;
  }

  interface PreferencePayer {
    email: string;
    first_name: string;
    last_name: string;
    identification: {
      type: string;
      number: string;
    };
  }

  interface PreferenceRequest {
    body: {
      items: Array<{
        id: string;
        title: string;
        description: string;
        unit_price: number;
        quantity: number;
        currency_id: string;
      }>;
      payer: {
        email: string;
        first_name: string;
        last_name: string;
        identification: {
          type: string;
          number: string;
        };
      };
      payment_methods: {
        excluded_payment_types: Array<{ id: string }>;
        installments: number;
        default_installments?: number;
      };
      binary_mode?: boolean;
      external_reference: string;
      expires: boolean;
      expiration_date_from: string;
      expiration_date_to: string;
      statement_descriptor?: string;
    };
  }

  interface PreferenceResponse {
    id: string;
    init_point: string;
    sandbox_init_point: string;
    external_reference: string;
    date_created: string;
    binary_mode: boolean;
    items: Array<{
      id: string;
      title: string;
      description: string;
      unit_price: number;
      quantity: number;
      currency_id: string;
    }>;
    payer: {
      email: string;
      identification: {
        type: string;
        number: string;
      };
    };
  }

  export class Preference {
    constructor(config: MercadoPagoConfig);
    create(data: PreferenceRequest): Promise<PreferenceResponse>;
    get(data: { preferenceId: string }): Promise<PreferenceResponse>;
  }

  export class MercadoPagoConfig {
    constructor(config: { accessToken: string });
  }

  interface TransactionData {
    qr_code: string;
    qr_code_base64: string;
    ticket_url: string;
  }

  interface PointOfInteraction {
    transaction_data: TransactionData;
    type?: string;
  }

  interface PaymentResponse {
    id: string;
    status: string;
    status_detail: string;
    transaction_amount: number;
    description: string;
    payment_method_id: string;
    point_of_interaction?: PointOfInteraction;
    date_created: string;
    date_of_expiration?: string;
    payer: {
      email: string;
      first_name: string;
      last_name: string;
      identification: {
        type: string;
        number: string;
      };
    };
  }

  interface SearchOptions {
    options: {
      limit: number;
      offset: number;
      sort?: string;
    };
  }

  interface SearchResult {
    results: any[];
    paging: {
      total: number;
      limit: number;
      offset: number;
    };
  }

  export class Payment {
    constructor(config: MercadoPagoConfig);
    create(data: any): Promise<PaymentResponse>;
    get(data: { id: string }): Promise<PaymentResponse>;
    search(options: SearchOptions): Promise<SearchResult>;
  }
}
