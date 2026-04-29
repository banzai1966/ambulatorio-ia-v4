const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/process-clinical', {
      input: "O Paciente chama-se Carlos de Souza, 45 anos. No exame neurológico ele apresenta fácies típica, atitude ativa e dominância destra. A marcha é normal. A fluência verbal é da classe 30 a 45. O teste cognitivo apresentou orientação temporal e espacial normais, memória imediata e repetição preservadas, atingindo um total de 28 na pontuação. Na avaliação dos nervos cranianos, as pupilas direita e esquerda reagem normalmente e o fundo de olho está alterado. O teste de coordenação index-nariz obteve status normal, e o reflexo de romberg também normal. Para a força muscular da face, o tônus e trofismo são normais, sem deformidades. Sensibilidade de toque na cabeça preservada. Sobre a área de dores do mapeamento, o paciente manifesta uma dor aguda no ombro direito, fisgada forte no joelho esquerdo anterior e uma dor persistente na região lombar posterior. Hipótese: Cervicalgia tensional. Conduta: Administrar anti-inflamatório. Prescrição: Ibuprofeno 400mg, 1 comprimido pela manhã.",
      examMode: "neurological",
      reason: "avaliação"
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
