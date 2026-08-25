export interface EncryptedBodyRequest {
  encrypted_aes_key: string
  encrypted_flow_data: string
  initial_vector: string
}
