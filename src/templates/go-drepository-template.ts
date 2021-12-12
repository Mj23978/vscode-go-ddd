import * as changeCase from "change-case";

export function getDomainRepositoryTemplate(
  name: string
) {
  const pascalCaseName = changeCase.pascalCase(name.toLowerCase());
  const paramCaseName = changeCase.paramCase(name.toLowerCase());
  return `package ${paramCaseName}

type ${pascalCaseName}Repository interface {
  Create(data *${pascalCaseName}) error
  FindBy(filter map[string]interface{}) (*${pascalCaseName}, error)
}
`;
}