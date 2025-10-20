/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_QUANTUM_ALGEBRA_URL: string;
  readonly VITE_QUANTUM_SCHEDULER_URL: string;
  readonly VITE_QUANTUM_ERROR_CORRECTION_URL: string;
  readonly VITE_QUANTUM_INTERFACE_URL: string;
  readonly VITE_QUANTUM_ML_URL: string;
  readonly VITE_APP_ENVIRONMENT: string;
  readonly VITE_ENABLE_QUANTUM_FEATURES: string;
  readonly VITE_MAX_QUBITS: string;
  readonly VITE_ENABLE_ERROR_CORRECTION: string;
  readonly VITE_ENABLE_VQC_TRAINING: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
