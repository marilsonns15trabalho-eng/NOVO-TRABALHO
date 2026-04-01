import type { ProtocoloAvaliacao } from '@/types/avaliacao';

type GenderLike = 'male' | 'female';

type StudentBiometricContext =
  | {
      gender?: unknown;
      sexo?: unknown;
      birth_date?: unknown;
      data_nascimento?: unknown;
    }
  | null
  | undefined;

export type DadosBiometricosInput = Record<string, unknown> & {
  peso?: number | string;
  altura?: number | string;
  cintura?: number | string;
  quadril?: number | string;
  pescoco?: number | string;
  tricipital?: number | string;
  subescapular?: number | string;
  supra_iliaca?: number | string;
  suprailiaca?: number | string;
  abdominal?: number | string;
  protocolo?: ProtocoloAvaliacao | string;
  gender?: string | null;
  sexo?: string | null;
  student_gender?: string | null;
  birth_date?: string | null;
  data_nascimento?: string | null;
  student_birth_date?: string | null;
  students?: StudentBiometricContext;
};

export interface ResultadoBiometrico {
  imc: number;
  soma_dobras: number;
  percentual_gordura: number;
  massa_gorda: number;
  massa_magra: number;
  rcq?: number;
}

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asProtocol(value: unknown): ProtocoloAvaliacao {
  if (value === 'navy' || value === 'pollock3' || value === 'pollock7') {
    return value;
  }

  return 'faulkner';
}

export function getAvaliacaoProtocolLabel(protocolo?: string | null): string {
  switch (asProtocol(protocolo)) {
    case 'navy':
      return 'US Navy (Circunferencias)';
    case 'pollock3':
      return 'Pollock (3 Dobras)';
    case 'pollock7':
      return 'Pollock (7 Dobras)';
    default:
      return 'Faulkner (4 Dobras)';
  }
}

export function normalizeBiometricGender(value: unknown): GenderLike | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (
    normalized === 'm' ||
    normalized === 'male' ||
    normalized === 'masculino' ||
    normalized === 'homem'
  ) {
    return 'male';
  }

  if (
    normalized === 'f' ||
    normalized === 'female' ||
    normalized === 'feminino' ||
    normalized === 'mulher'
  ) {
    return 'female';
  }

  return null;
}

function resolveBiometricGender(dados: DadosBiometricosInput): GenderLike | null {
  return (
    normalizeBiometricGender(dados.student_gender) ||
    normalizeBiometricGender(dados.gender) ||
    normalizeBiometricGender(dados.sexo) ||
    normalizeBiometricGender(dados.students?.gender) ||
    normalizeBiometricGender(dados.students?.sexo)
  );
}

function normalizeHeightInCm(altura: number): number {
  if (altura <= 0) {
    return 0;
  }

  return altura > 3 ? altura : altura * 100;
}

function toInches(valueInCm: number): number {
  return valueInCm > 0 ? valueInCm / 2.54 : 0;
}

function calculateFaulknerPercent(somaDobras: number): number {
  if (somaDobras <= 0) {
    return 0;
  }

  return somaDobras * 0.153 + 5.783;
}

function calculateNavyPercent(dados: DadosBiometricosInput): number {
  const gender = resolveBiometricGender(dados);
  const cinturaIn = toInches(asNumber(dados.cintura));
  const quadrilIn = toInches(asNumber(dados.quadril));
  const pescocoIn = toInches(asNumber(dados.pescoco));
  const alturaIn = toInches(normalizeHeightInCm(asNumber(dados.altura)));

  if (!gender || alturaIn <= 0 || cinturaIn <= 0 || pescocoIn <= 0) {
    return 0;
  }

  if (gender === 'male') {
    const diferencial = cinturaIn - pescocoIn;
    if (diferencial <= 0) {
      return 0;
    }

    const percentual =
      86.01 * Math.log10(diferencial) - 70.041 * Math.log10(alturaIn) + 36.76;

    return Number.isFinite(percentual) ? percentual : 0;
  }

  if (quadrilIn <= 0) {
    return 0;
  }

  const diferencial = cinturaIn + quadrilIn - pescocoIn;
  if (diferencial <= 0) {
    return 0;
  }

  const percentual =
    163.205 * Math.log10(diferencial) - 97.684 * Math.log10(alturaIn) - 78.387;

  return Number.isFinite(percentual) ? percentual : 0;
}

export function getBiometriaValidationMessage(dados: DadosBiometricosInput): string | null {
  const protocolo = asProtocol(dados.protocolo);

  if (protocolo !== 'navy') {
    return null;
  }

  const gender = resolveBiometricGender(dados);
  if (!gender) {
    return 'Para usar o protocolo US Navy, o aluno precisa ter sexo cadastrado.';
  }

  if (asNumber(dados.altura) <= 0 || asNumber(dados.cintura) <= 0 || asNumber(dados.pescoco) <= 0) {
    return 'Para usar o protocolo US Navy, preencha altura, cintura e pescoco.';
  }

  if (gender === 'female' && asNumber(dados.quadril) <= 0) {
    return 'Para usar o protocolo US Navy em mulheres, preencha tambem o quadril.';
  }

  if (gender === 'male' && asNumber(dados.cintura) <= asNumber(dados.pescoco)) {
    return 'Confira cintura e pescoco. No protocolo US Navy, a cintura deve ser maior que o pescoco.';
  }

  if (
    gender === 'female' &&
    asNumber(dados.cintura) + asNumber(dados.quadril) <= asNumber(dados.pescoco)
  ) {
    return 'Confira cintura, quadril e pescoco. Os valores informados nao permitem o calculo US Navy.';
  }

  return null;
}

export function calcularRcq(
  cintura?: number | string | null,
  quadril?: number | string | null,
): number | undefined {
  const cinturaValue = asNumber(cintura);
  const quadrilValue = asNumber(quadril);

  if (cinturaValue <= 0 || quadrilValue <= 0) {
    return undefined;
  }

  return Number((cinturaValue / quadrilValue).toFixed(2));
}

export function calcularBiometria(dados: DadosBiometricosInput): ResultadoBiometrico {
  const peso = asNumber(dados.peso);
  const altura = asNumber(dados.altura);
  const alturaM = altura > 3 ? altura / 100 : altura;
  const protocolo = asProtocol(dados.protocolo);

  const imc = alturaM > 0 ? peso / (alturaM * alturaM) : 0;

  const somaDobras =
    asNumber(dados.tricipital) +
    asNumber(dados.subescapular) +
    asNumber(dados.suprailiaca ?? dados.supra_iliaca) +
    asNumber(dados.abdominal);

  let percentualGordura = 0;

  if (protocolo === 'navy') {
    percentualGordura = calculateNavyPercent(dados);
  } else {
    // Faulkner/Yuhasz 4 dobras: %G = (soma das 4 dobras x 0.153) + 5.783
    percentualGordura = calculateFaulknerPercent(somaDobras);
  }

  const massaGorda = peso > 0 ? peso * (percentualGordura / 100) : 0;
  const massaMagra = peso > 0 ? peso - massaGorda : 0;

  return {
    imc: Number(imc.toFixed(2)),
    percentual_gordura: Number(percentualGordura.toFixed(2)),
    massa_gorda: Number(massaGorda.toFixed(2)),
    massa_magra: Number(massaMagra.toFixed(2)),
    soma_dobras: Number(somaDobras.toFixed(2)),
    rcq: calcularRcq(dados.cintura, dados.quadril),
  };
}
