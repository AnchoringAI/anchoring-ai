export function convertChains(chain) {
  let result = [];

  for (let item of chain) {
    let { id, type, title, isAppInput, isAppOutput, input, parameters } = item;
    result.push({
      id,
      type,
      title,
      isAppInput,
      isAppOutput,
      input,
      parameters,
    });
  }

  return result;
}
