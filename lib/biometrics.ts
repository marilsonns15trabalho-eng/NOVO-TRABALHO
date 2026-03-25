// Cálculo biométrico — fonte única de verdade (frontend + avaliacoes.service)

/** Entrada flexível: formulário usa supra_iliaca; aceita também suprailiaca */
export type DadosBiometricosInput = Record<string, unknown> & {
  peso?: number | string;
  altura?: number | string;
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
}

/**
 * IMC e composição a partir de peso, altura e 4 dobras.
 * Altura: se > 3, interpreta como cm (divide por 100); senão, como metros (compatível com dados legados).
 * % gordura: soma das dobras × 0,153 (fórmula simplificada, ajustável depois).
 */
export function calcularBiometria(dados: DadosBiometricosInput): ResultadoBiometrico {
  const peso = Number(dados.peso) || 0;
  const altura = Number(dados.altura) || 0;

  const alturaM = altura > 3 ? altura / 100 : altura;

  const imc = alturaM > 0 ? peso / (alturaM * alturaM) : 0;

  const somaDobras =
    Number(dados.tricipital || 0) +
    Number(dados.subescapular || 0) +
    Number(dados.suprailiaca ?? dados.supra_iliaca ?? 0) +
    Number(dados.abdominal || 0);

  const percentualGordura = somaDobras > 0 ? somaDobras * 0.153 : 0;

  const massaGorda = peso * (percentualGordura / 100);
  const massaMagra = peso - massaGorda;

  return {
    imc: Number(imc.toFixed(2)),
    percentual_gordura: Number(percentualGordura.toFixed(2)),
    massa_gorda: Number(massaGorda.toFixed(2)),
    massa_magra: Number(massaMagra.toFixed(2)),
    soma_dobras: Number(somaDobras.toFixed(2)),
  };
}
