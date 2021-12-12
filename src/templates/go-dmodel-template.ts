import * as changeCase from "change-case";

export function getDomainModelTemplate(
  name: string
) {
  const pascalCaseName = changeCase.pascalCase(name.toLowerCase());
  const paramCaseName = changeCase.paramCase(name.toLowerCase());
  return `package ${paramCaseName}

type ${pascalCaseName} struct {
	Username string \`json:"username" bson:"username" msgpack:"username" validate:"empty=false"\`
	Password string \`json:"password" bson:"password" msgpack:"password"\`
}
`;
}