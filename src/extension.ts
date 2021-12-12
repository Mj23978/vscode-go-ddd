import * as _ from "lodash";
import * as changeCase from "change-case";
import * as mkdirp from "mkdirp";

import {
	commands,
	ExtensionContext,
	InputBoxOptions,
	OpenDialogOptions,
	Uri,
	window,
	QuickPickOptions
} from "vscode";
import { existsSync, lstatSync, writeFile } from "fs";
import { getDomainServiceTemplate } from "./templates/go-dservice-template";
import { getDomainModelTemplate } from "./templates/go-dmodel-template";
import { getDomainRepositoryTemplate } from "./templates/go-drepository-template";
import { getDomainSerializerTemplate } from "./templates/go-dserializer-template";
import { getSerializerJsonTemplate } from "./templates/go-serializer-json-template";
import { getSerializerMsgPackTemplate } from "./templates/go-serializer-msgpack-template";
import { getRepositoryElasticTemplate } from "./templates/go-repository-elastic-template";
import { getRepositoryMySQLTemplate } from "./templates/go-repository-mysql-template";
import { getRepositoryKafkaTemplate } from "./templates/go-repository-kafka-template";
import { getRepositoryRedisTemplate } from "./templates/go-repository-redis-template";
import { getRepositoryMongoDBTemplate } from "./templates/go-repository-mongo-template";
import { getRepositoryPostgresTemplate } from "./templates/go-repository-postgres-template";
// import { getDomainLogicTemplate } from "./templates/go-dlogic-template";

export function activate(_context: ExtensionContext) {

	commands.registerCommand("extension.new-go-ddd", async (uri: Uri) => {
		const domainName = await promptForDomainName();
		if (_.isNil(domainName) || domainName.trim() === "") {
			window.showErrorMessage("The domain name must not be empty");
			return;
		}

		let targetDirectory;
		if (_.isNil(_.get(uri, "fsPath")) || !lstatSync(uri.fsPath).isDirectory()) {
			targetDirectory = await promptForTargetDirectory();
			if (_.isNil(targetDirectory)) {
				window.showErrorMessage("Please select a valid directory");
				return;
			}
		} else {
			targetDirectory = uri.fsPath;
		}

		let domainComponent = await promptForDDDComponent();
		let repositoryType: string | undefined;
		let serializerType: string | undefined;
		// let apiType: string | undefined;
		if (domainComponent === undefined) {
			domainComponent = "Domain"
		} else if (domainComponent === "Repository") {
			repositoryType = await promptForRepositoryType();
		} else if (domainComponent === "Serializer") {
			serializerType = await promptForSerializerType();
		}
		// else if (domainComponent === "API") {
		// 	apiType = await promptForAPIType();
		// }
		console.log(domainComponent)

		const pascalCaseDomainName = changeCase.pascalCase(domainName.toLowerCase());
		try {
			await generateDDDCode(domainName, targetDirectory, domainComponent, repositoryType, serializerType);
			window.showInformationMessage(
				`Successfully Generated ${pascalCaseDomainName} Domain Components`
			);
		} catch (error) {
			window.showErrorMessage(
				`Error:
        ${error instanceof Error ? error.message : JSON.stringify(error)}`
			);
		}
	});
}

function promptForDomainName(): Thenable<string | undefined> {
	const domainNamePromptOptions: InputBoxOptions = {
		prompt: "Domain Name",
		placeHolder: "User"
	};
	return window.showInputBox(domainNamePromptOptions);
}

function promptForDDDComponent(): Thenable<string | undefined> {
	const DDDComponentPromptValues: string[] = ["Domain", "Repository", "Serializer"];
	const DDDComponentPromptOptions: QuickPickOptions = {
		placeHolder:
			"Choose what Component of DDD do you want to generate ? ( Default is Domain )",
		canPickMany: false
	};
	return window.showQuickPick(
		DDDComponentPromptValues,
		DDDComponentPromptOptions
	);
}

function promptForRepositoryType(): Thenable<string | undefined> {
	const useDomainPromptValues: string[] = ["Postgres", "MongoDB", "Redis", "ElasticSearch", "Kafka", "MySQL"];
	const useDomainPromptOptions: QuickPickOptions = {
		placeHolder:
			"Now Choose what Type of Repository do you want to generate ? ( Default is Postgres )",
		canPickMany: true
	};
	return window.showQuickPick(
		useDomainPromptValues,
		useDomainPromptOptions
	);
}

// function promptForAPIType(): Thenable<string | undefined> {
// 	const useDomainPromptValues: string[] = ["Rest (chi)", "Rest (fiber)", "GRPC", "GraphQL"];
// 	const useDomainPromptOptions: QuickPickOptions = {
// 		placeHolder:
// 			"Now Choose what Type of API do you want to generate ? ( Default is Rest(chi) )",
// 		canPickMany: false
// 	};
// 	return window.showQuickPick(
// 		useDomainPromptValues,
// 		useDomainPromptOptions
// 	);
// }

function promptForSerializerType(): Thenable<string | undefined> {
	const useDomainPromptValues: string[] = ["Json", "MsgPack"];
	const useDomainPromptOptions: QuickPickOptions = {
		placeHolder:
			"Now Choose what Type of Serializer do you want to generate ? ( Default is Json )",
		canPickMany: true
	};
	return window.showQuickPick(
		useDomainPromptValues,
		useDomainPromptOptions
	);
}

async function promptForTargetDirectory(): Promise<string | undefined> {
	const options: OpenDialogOptions = {
		canSelectMany: false,
		openLabel: "Select a folder to create the ddd component in",
		canSelectFolders: true
	};

	return window.showOpenDialog(options).then(uri => {
		if (_.isNil(uri) || _.isEmpty(uri)) {
			return undefined;
		}
		return uri[0].fsPath;
	});
}

async function generateDDDCode(
	domainName: string,
	targetDirectory: string,
	domainType: string,
	repositoryType?: string | string[],
	serializerType?: string | string[],
	// apiType?: string,
) {
	if (domainType === "Domain") {
		console.log("Generate Domain Components")
		const snakeCaseDomainName = changeCase.snakeCase(domainName.toLowerCase());
		const domainDirectoryPath = `${targetDirectory}/${snakeCaseDomainName}`;
		if (!existsSync(domainDirectoryPath)) {
			await createDirectory(domainDirectoryPath);
		}
		await Promise.all([
			createDomainTemplate(domainName, domainDirectoryPath),
		]);
	} else if (domainType === "Serializer") {
		if (serializerType?.includes("MsgPack")) {
			console.log("Generate MsgPack Serializer")
			const domainDirectoryPath = `${targetDirectory}/msgpack/`;
			if (!existsSync(domainDirectoryPath)) {
				await createDirectory(domainDirectoryPath);
			}
			await Promise.all([
				createMsgPackTemplate(domainName, domainDirectoryPath),
			]);
		}
		if (serializerType?.includes("Json")) {
			console.log("Generate Json Serializer")
			const domainDirectoryPath = `${targetDirectory}/json/`;
			if (!existsSync(domainDirectoryPath)) {
				await createDirectory(domainDirectoryPath);
			}
			await Promise.all([
				createJsonTemplate(domainName, domainDirectoryPath),
			]);
		}
	} else if (domainType === "Repository") {
		if (serializerType?.includes("Postgres")) {
			console.log("Generate Postgres Repository")
			const domainDirectoryPath = `${targetDirectory}/postgres/`;
			if (!existsSync(domainDirectoryPath)) {
				await createDirectory(domainDirectoryPath);
			}
			await Promise.all([
				createPostgresTemplate(domainName, domainDirectoryPath),
			]);
		}
		if (serializerType?.includes("MongoDB")) {
			console.log("Generate MongoDB Repository")
			const domainDirectoryPath = `${targetDirectory}/mongo/`;
			if (!existsSync(domainDirectoryPath)) {
				await createDirectory(domainDirectoryPath);
			}
			await Promise.all([
				createMongoDBTemplate(domainName, domainDirectoryPath),
			]);
		}
		if (serializerType?.includes("Redis")) {
			console.log("Generate Redis Repository")
			const domainDirectoryPath = `${targetDirectory}/redis/`;
			if (!existsSync(domainDirectoryPath)) {
				await createDirectory(domainDirectoryPath);
			}
			await Promise.all([
				createRedisTemplate(domainName, domainDirectoryPath),
			]);
		}
		if (serializerType?.includes("Kafka")) {
			console.log("Generate Kafka Repository")
			const domainDirectoryPath = `${targetDirectory}/kafka/`;
			if (!existsSync(domainDirectoryPath)) {
				await createDirectory(domainDirectoryPath);
			}
			await Promise.all([
				createKafkaTemplate(domainName, domainDirectoryPath),
			]);
		}
		if (serializerType?.includes("ElasticSearch")) {
			console.log("Generate ElasticSearch Repository")
			const domainDirectoryPath = `${targetDirectory}/elastic/`;
			if (!existsSync(domainDirectoryPath)) {
				await createDirectory(domainDirectoryPath);
			}
			await Promise.all([
				createElasticSearchTemplate(domainName, domainDirectoryPath),
			]);
		}
		if (serializerType?.includes("MySQL")) {
			console.log("Generate MySQL Repository")
			const domainDirectoryPath = `${targetDirectory}/mysql/`;
			if (!existsSync(domainDirectoryPath)) {
				await createDirectory(domainDirectoryPath);
			}
			await Promise.all([
				createMySQLTemplate(domainName, domainDirectoryPath),
			]);
		}
	}

}

function createDirectory(targetDirectory: string): Promise<void> {
	return new Promise((resolve, reject) => {
		mkdirp(targetDirectory, error => {
			if (error) {
				return reject(error);
			}
			resolve();
		});
	});
}

class DomainClass {
	name: string;
	func: Function;

	constructor(name: string, func: Function) {
		this.name = name;
		this.func = func;
	}
}

const domainList: DomainClass[] = [
	new DomainClass("service", getDomainServiceTemplate),
	new DomainClass("model", getDomainModelTemplate),
	// new DomainClass("logic", getDomainLogicTemplate),
	new DomainClass("serializer", getDomainSerializerTemplate),
	new DomainClass("repository", getDomainRepositoryTemplate),
]

function createDomainTemplate(
	domainName: string,
	domainDirectory: string
) {
	let res: Promise<void>[] = [];
	for (const domain of domainList) {
		const indexPath = `${domainDirectory}/${domain.name}.go`;
		if (existsSync(indexPath)) {
			console.log(`${domain.name}.go already exists`);
		} else {
			res.push(new Promise(async (resolve, reject) => {
				writeFile(indexPath, domain.func(domainName), "utf8", error => {
					if (error) {
						reject(error);
						return;
					}
					resolve();
				});
			}))
		};
	}
	return Promise.all(res);
}

function createMsgPackTemplate(
	domainName: string,
	msgpackDirectory: string
) {
	const indexPath = `${msgpackDirectory}/${domainName.toLowerCase()}.go`;
	if (existsSync(indexPath)) {
		throw Error(`msgpack/${domainName.toLowerCase()}.go already exists`);
	}
	return new Promise(async (resolve, reject) => {
		writeFile(indexPath, getSerializerMsgPackTemplate(domainName), "utf8", error => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}

function createJsonTemplate(
	domainName: string,
	jsonDirectory: string
) {
	const indexPath = `${jsonDirectory}/${domainName.toLowerCase()}.go`;
	if (existsSync(indexPath)) {
		throw Error(`json/${domainName.toLowerCase()}.go already exists`);
	}
	return new Promise(async (resolve, reject) => {
		writeFile(indexPath, getSerializerJsonTemplate(domainName), "utf8", error => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}

function createPostgresTemplate(
	domainName: string,
	postgresDirectory: string
) {
	const indexPath = `${postgresDirectory}/${domainName.toLowerCase()}.go`;
	if (existsSync(indexPath)) {
		throw Error(`postgres/${domainName.toLowerCase()}.go already exists`);
	}
	return new Promise(async (resolve, reject) => {
		writeFile(indexPath, getRepositoryPostgresTemplate(domainName), "utf8", error => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}

function createMongoDBTemplate(
	domainName: string,
	mongoDirectory: string
) {
	const indexPath = `${mongoDirectory}/${domainName.toLowerCase()}.go`;
	if (existsSync(indexPath)) {
		throw Error(`mongo/${domainName.toLowerCase()}.go already exists`);
	}
	return new Promise(async (resolve, reject) => {
		writeFile(indexPath, getRepositoryMongoDBTemplate(domainName), "utf8", error => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}

function createRedisTemplate(
	domainName: string,
	redisDirectory: string
) {
	const indexPath = `${redisDirectory}/${domainName.toLowerCase()}.go`;
	if (existsSync(indexPath)) {
		throw Error(`redis/${domainName.toLowerCase()}.go already exists`);
	}
	return new Promise(async (resolve, reject) => {
		writeFile(indexPath, getRepositoryRedisTemplate(domainName), "utf8", error => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}

function createKafkaTemplate(
	domainName: string,
	kafkaDirectory: string
) {
	const indexPath = `${kafkaDirectory}/${domainName.toLowerCase()}.go`;
	if (existsSync(indexPath)) {
		throw Error(`kafka/${domainName.toLowerCase()}.go already exists`);
	}
	return new Promise(async (resolve, reject) => {
		writeFile(indexPath, getRepositoryKafkaTemplate(domainName), "utf8", error => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}

function createElasticSearchTemplate(
	domainName: string,
	elasticDirectory: string
) {
	const indexPath = `${elasticDirectory}/${domainName.toLowerCase()}.go`;
	if (existsSync(indexPath)) {
		throw Error(`elastic/${domainName.toLowerCase()}.go already exists`);
	}
	return new Promise(async (resolve, reject) => {
		writeFile(indexPath, getRepositoryElasticTemplate(domainName), "utf8", error => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}

function createMySQLTemplate(
	domainName: string,
	mysqlDirectory: string
) {
	const indexPath = `${mysqlDirectory}/${domainName.toLowerCase()}.go`;
	if (existsSync(indexPath)) {
		throw Error(`mysql/${domainName.toLowerCase()}.go already exists`);
	}
	return new Promise(async (resolve, reject) => {
		writeFile(indexPath, getRepositoryMySQLTemplate(domainName), "utf8", error => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}


