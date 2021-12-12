import * as changeCase from "change-case";

export function getDomainServiceTemplate(
	name: string
) {
	const pascalCaseName = changeCase.pascalCase(name.toLowerCase());
	const paramCaseName = changeCase.paramCase(name.toLowerCase());
	return `package ${paramCaseName}

import (
	errs "github.com/pkg/errors"
	"gopkg.in/dealancer/validate.v2"
)

type ${pascalCaseName}Service interface {
	FindById(id int) (*${pascalCaseName}, error)
	Create(${name.toLowerCase()} *${pascalCaseName}) error
}

type ${name.toLowerCase()}Service struct {
	${name.toLowerCase()}Repo ${pascalCaseName}Repository
}

func New${pascalCaseName}Service(${name.toLowerCase()}Repo ${pascalCaseName}Repository) ${pascalCaseName}Service {
	return &${name.toLowerCase()}Service{
		${name.toLowerCase()}Repo,
	}
}

func (svc *${name.toLowerCase()}Service) Create(${name.toLowerCase()} *${pascalCaseName}) error {
	if e := validate.Validate(${name.toLowerCase()}); e != nil {
		return errs.Wrap(e, "service.${pascalCaseName}.Store")
	}
	// ${name.toLowerCase()}.Password = repo.EncryptPassword(data.Password)
	return svc.${name.toLowerCase()}Repo.Create(${name.toLowerCase()})
}

func (svc *${name.toLowerCase()}Service) FindById(id int) (*${pascalCaseName}, error) {
	filter := map[string]interface{}{"id": id}
	res, e := svc.${name.toLowerCase()}Repo.FindBy(filter)
	if e != nil {
		return res, errs.Wrap(e, "service.News.GetById")
	}
	return res, nil
}
`;
}