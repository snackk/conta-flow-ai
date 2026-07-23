const MESSAGES = {
  'auth/email-already-in-use': 'Já existe uma conta com este email.',
  'auth/invalid-email': 'O email introduzido não é válido.',
  'auth/weak-password': 'A password deve ter pelo menos 6 caracteres.',
  'auth/user-not-found': 'Não existe nenhuma conta com este email.',
  'auth/wrong-password': 'Password incorreta.',
  'auth/invalid-credential': 'Email ou password incorretos.',
  'auth/too-many-requests': 'Demasiadas tentativas. Tente novamente mais tarde.',
};

export function getAuthErrorMessage(error) {
  return MESSAGES[error?.code] || 'Ocorreu um erro. Tente novamente.';
}
