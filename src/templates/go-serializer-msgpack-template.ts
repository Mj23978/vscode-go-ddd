import * as changeCase from "change-case";

export function getSerializerMsgPackTemplate(
  name: string
) {
  const pascalCaseName = changeCase.pascalCase(name.toLowerCase());
  return `package msgpack

import (
  "github.com/pkg/errors"
	"github.com/vmihailenco/msgpack"
)

type ${pascalCaseName} struct{}

func (${name.toLowerCase().charAt(0)} *${pascalCaseName}) Decode(input []byte) (*${pascalCaseName}, error) {
	${name.toLowerCase()} := new(${pascalCaseName})
	if e := msgpack.Unmarshal(input, ${name.toLowerCase()}); e != nil {
		return nil, errors.Wrap(e, "serializer.Json.Decode")
	}
	return ${name.toLowerCase()}, nil
}

func (${name.toLowerCase().charAt(0)} *${pascalCaseName}) Encode(input *${pascalCaseName}) ([]byte, error) {
	rawMsg, e := msgpack.Marshal(input)
	if e != nil {
		return nil, errors.Wrap(e, "serializer.Json.Encode")
	}
	return rawMsg, nil
}

func (${name.toLowerCase().charAt(0)} *${pascalCaseName}) DecodeMap(input []byte) (map[string]interface{}, error) {
	res := map[string]interface{}{}
	if e := msgpack.Unmarshal(input, &res); e != nil {
		return res, errors.Wrap(e, "serializer.Json.DecodeMap")
	}
	return res, nil
}

func (${name.toLowerCase().charAt(0)} *${pascalCaseName}) EncodeMap(input map[string]interface{}) ([]byte, error) {
	rawMsg, e := msgpack.Marshal(input)
	if e != nil {
		return nil, errors.Wrap(e, "serializer.Json.EncodeMap")
	}
	return rawMsg, nil
}`;
}