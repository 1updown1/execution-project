const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const envFileName = '.env.local';
const jsPathName = 'ENTRY_JS_PATH';
const jsPathReg = new RegExp(`\\b(${jsPathName}=).*`);

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const runningTask = {};
	let taskId = 1;
	let disposable = vscode.commands.registerCommand('extension.BuildProject', function (uri) {

		let pathSep = uri.fsPath.split(path.sep);

		const projectPathIndex = pathSep.indexOf('theia_web_page');
		const srcPathIndex = pathSep.indexOf('src');

		if (projectPathIndex != -1 && srcPathIndex != -1 && srcPathIndex != pathSep.length - 1){
			const projectPath = path.join(...pathSep.slice(0, projectPathIndex + 1));
			fs.readFile(`${projectPath}/${envFileName}`, 'utf8', (err, file) => {
				if (err) file = '';
				const options = {
					flag: '',
					encoding: 'utf-8',
				}
				if(jsPathReg.test(file)){
					options.flag = 'w';
					file = file.replace(jsPathReg, `$1${path.join(...pathSep.slice(srcPathIndex + 1))}`);
				}else{
					options.flag = 'a';
					if(file != '') file += '\n';
					file = `${jsPathName}=${path.join(...pathSep.slice(srcPathIndex + 1))}`;
				}
				fs.writeFile(`${projectPath}/${envFileName}`, file, options, err => {
					if (err) {
						vscode.window.showErrorMessage(`写入${envFileName}文件失败`);
						return;
					}
					vscode.window.showInformationMessage('项目运行方式', '本地', '打包').then(value => {
						if(!value) return;
						let id = 0;
						let command = '';
						if(value == '本地'){
							command = 'start';
							if (!runningTask[uri.fsPath]){
								id = ++taskId;
								runningTask[uri.fsPath] = id;
							}else{
								id = runningTask[uri.fsPath];
							}
						}else{
							command = 'build';
							id = ++taskId;
						}
						vscode.tasks.executeTask(new vscode.Task(
							{ type: 'BuildProject', id },
							vscode.TaskScope.Global,
							'project build',
							'npm',
							new vscode.ShellExecution(`cd /${projectPath} && npm run ${command}`)
						));
					});
				})
			})
		}else{
			vscode.window.showWarningMessage('请选择theia_web_page项目进行打包');
		}
		
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
