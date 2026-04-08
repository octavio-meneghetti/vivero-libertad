async function listModels() {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyDmqQTLjI1PE_CgWUh3z5guuloqizwUcx8");
  const json = await res.json();
  const models = json.models.map(m => m.name);
  console.log("AVAILABLE MODELS:", models);
}
listModels();
