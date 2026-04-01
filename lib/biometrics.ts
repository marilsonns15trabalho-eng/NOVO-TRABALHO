export type DadosBiometricosInput = Record<string, unknown> & {
  peso?: number | string;
  altura?: number | string;
  cintura?: number | string;
  quadril?: number | string;
  tricipital?: number | string;
  subescapular?: number | string;
  supra_iliaca?: number | string;
  suprailiaca?: number | string;
  abdominal?: number | string;
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

  const imc = alturaM > 0 ? peso / (alturaM * alturaM) : 0;

  const somaDobras =
    asNumber(dados.tricipital) +
    asNumber(dados.subescapular) +
    asNumber(dados.suprailiaca ?? dados.supra_iliaca) +
    asNumber(dados.abdominal);

  // Faulkner/Yuhasz 4 dobras: %G = (Σ4 x 0.153) + 5.783
  const percentualGordura = somaDobras > 0 ? somaDobras * 0.153 + 5.783 : 0;
  const massaGorda = peso * (percentualGordura / 100);
  const massaMagra = peso - massaGorda;

  return {
    imc: Number(imc.toFixed(2)),
    percentual_gordura: Number(percentualGordura.toFixed(2)),
    massa_gorda: Number(massaGorda.toFixed(2)),
    massa_magra: Number(massaMagra.toFixed(2)),
    soma_dobras: Number(somaDobras.toFixed(2)),
    rcq: calcularRcq(dados.cintura, dados.quadril),
  };
}
