import { useToast } from '../context/ToastContext';

interface CrudMessages {
  create: {
    loading: string;
    success: string;
    error: string;
  };
  update: {
    loading: string;
    success: string;
    error: string;
  };
  delete: {
    loading: string;
    success: string;
    error: string;
  };
  toggle?: {
    loading: string;
    success: (isActive: boolean) => string;
    error: string;
  };
}

// Configuración global del delay (en milisegundos)
const LOADING_DELAY_MS = 500;

export function useCrudNotifications(entityName: string) {
  const toast = useToast();

  const defaultMessages: CrudMessages = {
    create: {
      loading: `Creando ${entityName}...`,
      success: `${entityName} creado exitosamente`,
      error: `Error al crear ${entityName}`,
    },
    update: {
      loading: `Actualizando ${entityName}...`,
      success: `${entityName} actualizado exitosamente`,
      error: `Error al actualizar ${entityName}`,
    },
    delete: {
      loading: `Eliminando ${entityName}...`,
      success: `${entityName} eliminado exitosamente`,
      error: `Error al eliminar ${entityName}`,
    },
    toggle: {
      loading: `Cambiando estado...`,
      success: (isActive: boolean) => `${entityName} ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      error: `Error al cambiar estado`,
    },
  };

  // Función helper que maneja el delay del loading
  const withDelayedLoading = async <T,>(
    action: () => Promise<T>,
    loadingMessage: string,
    successMessage: string,
    errorMessage: string
  ): Promise<T | null> => {
    let loadingToastId: string | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isCompleted = false;

    // Programar el loading después del delay
    timeoutId = setTimeout(() => {
      if (!isCompleted) {
        loadingToastId = toast.loading(loadingMessage);
      }
    }, LOADING_DELAY_MS);

    try {
      const result = await action();
      isCompleted = true;
      
      if (timeoutId) clearTimeout(timeoutId);
      if (loadingToastId) toast.dismiss(loadingToastId);
      
      toast.success(successMessage);
      return result;
    } catch (error: any) {
      isCompleted = true;
      
      if (timeoutId) clearTimeout(timeoutId);
      if (loadingToastId) toast.dismiss(loadingToastId);
      
      toast.error(error.message || errorMessage);
      return null;
    }
  };

  const executeCreate = async <T,>(
    mutation: () => Promise<T>,
    customMessages?: Partial<typeof defaultMessages.create>
  ): Promise<T | null> => {
    const messages = {
      loading: customMessages?.loading ?? defaultMessages.create.loading,
      success: customMessages?.success ?? defaultMessages.create.success,
      error: customMessages?.error ?? defaultMessages.create.error,
    };
    return withDelayedLoading(
      mutation,
      messages.loading,
      messages.success,
      messages.error
    );
  };

  const executeUpdate = async <T,>(
    mutation: () => Promise<T>,
    customMessages?: Partial<typeof defaultMessages.update>
  ): Promise<T | null> => {
    const messages = {
      loading: customMessages?.loading ?? defaultMessages.update.loading,
      success: customMessages?.success ?? defaultMessages.update.success,
      error: customMessages?.error ?? defaultMessages.update.error,
    };
    return withDelayedLoading(
      mutation,
      messages.loading,
      messages.success,
      messages.error
    );
  };

  const executeDelete = async <T,>(
    mutation: () => Promise<T>,
    customMessages?: Partial<typeof defaultMessages.delete>,
    confirmMessage?: string
  ): Promise<T | null> => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return null;
    }
    const messages = {
      loading: customMessages?.loading ?? defaultMessages.delete.loading,
      success: customMessages?.success ?? defaultMessages.delete.success,
      error: customMessages?.error ?? defaultMessages.delete.error,
    };
    return withDelayedLoading(
      mutation,
      messages.loading,
      messages.success,
      messages.error
    );
  };

  const executeToggle = async <T,>(
    mutation: () => Promise<T>,
    isActive: boolean,
    customMessages?: Partial<typeof defaultMessages.toggle>
  ): Promise<T | null> => {
    // Valores por defecto para toggle
    const defaultToggle = defaultMessages.toggle!;
    
    const loadingMsg = customMessages?.loading ?? defaultToggle.loading;
    const errorMsg = customMessages?.error ?? defaultToggle.error;
    
    // Procesar el mensaje de éxito (puede ser string o función)
    let successMsg: string;
    if (customMessages?.success) {
      // Si el custom es una función, la llamamos; si es string, lo usamos directamente
      successMsg = typeof customMessages.success === 'function' 
        ? customMessages.success(isActive) 
        : customMessages.success;
    } else {
      // Usamos el mensaje por defecto (que es una función)
      successMsg = defaultToggle.success(isActive);
    }
    
    return withDelayedLoading(
      mutation,
      loadingMsg,
      successMsg,
      errorMsg
    );
  };

  const executePromise = async <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ): Promise<T> => {
    return toast.promise(promise, messages);
  };

  return {
    executeCreate,
    executeUpdate,
    executeDelete,
    executeToggle,
    executePromise,
    toast,
  };
}