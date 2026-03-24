// Funções de cálculo biométrico — fonte única de verdade
// Usado por AvaliacaoModule e avaliacoes.service

export interface DadosBiometricos {
  peso: number;
  altura: number;
  tricipital?: number;
  subescapular?: number;
  supra_iliaca?: number;
  abdominal?: number;
  protocolo?: string;
}

export interface ResultadoBiometrico {
  imc: number;
  soma_dobras: number;
  percentual_gordura: number;
  massa_gorda: number;
  massa_magra: number;
}

/**
 * Calcula IMC, soma de dobras, %gordura, massa gorda e magra.
 * Protocolo Faulkner (4 dobras).
 * Retorna valores arredondados.
 */
export function calcularBiometria(dados: DadosBiometricos): ResultadoBiometrico {
  const { peso, altura, tricipital = 0, subescapular = 0, supra_iliaca = 0, abdominal = 0 } = dados;

  // IMC
  const alturaM = altura > 3 ? altura / 100 : altura; // aceita cm ou m
  const imc = alturaM > 0 ? parseFloat((peso / (alturaM * alturaM)).toFixed(2)) : 0;

  // Soma de dobras (Faulkner = 4 dobras)
  const soma_dobras = parseFloat((tricipital + subescapular + supra_iliaca + abdominal).toFixed(2));

  // %Gordura — Faulkner
  const percentual_gordura = soma_dobras > 0
    ? parseFloat(((soma_dobras * 0.153) + 5.783).toFixed(2))
    : 0;

  // Massa gorda e magra
  const massa_gorda = percentual_gordura > 0
    ? parseFloat((peso * (percentual_gordura / 100)).toFixed(2))
    : 0;

  const massa_magra = massa_gorda > 0
    ? parseFloat((peso - massa_gorda).toFixed(2))
    : peso;

  return { imc, soma_dobras, percentual_gordura, massa_gorda, massa_magra };
}
