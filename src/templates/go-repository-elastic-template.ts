import * as changeCase from "change-case";

export function getRepositoryElasticTemplate(
  name: string
) {
  const pascalCaseName = changeCase.pascalCase(name.toLowerCase());
  const paramCaseName = changeCase.paramCase(name.toLowerCase());
  return `package elasticsearch

type ${pascalCaseName}Serializer interface {
	Decode(input []byte) (*${pascalCaseName}, error)
	Encode(input *${pascalCaseName}) ([]byte, error)
}`;
}