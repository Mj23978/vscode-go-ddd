import * as changeCase from "change-case";

export function getRepositoryKafkaTemplate(
  name: string
) {
  const pascalCaseName = changeCase.pascalCase(name.toLowerCase());
  const paramCaseName = changeCase.paramCase(name.toLowerCase());
  return `package ${paramCaseName}

type ${pascalCaseName}Serializer interface {
	Decode(input []byte) (*${pascalCaseName}, error)
	Encode(input *${pascalCaseName}) ([]byte, error)
}`;
}