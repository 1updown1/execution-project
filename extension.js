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
	let disposable = vscode.commands.registerCommand('extension.touchpalBuild', function (uri) {

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
					file = `\n${jsPathName}=${path.join(...pathSep.slice(srcPathIndex + 1))}`;
				}
				fs.writeFile(`${projectPath}/${envFileName}`, file, options, err => {
					if (err) {
						vscode.window.showInformationMessage(`写入${envFileName}文件失败`);
						return;
					}
					vscode.tasks.executeTask(new vscode.Task(
						{ type: 'touchpalBuild' },
						vscode.TaskScope.Global,
						'project build',
						'npm',
						new vscode.ShellExecution(`cd /${projectPath} && npm run build`)
					))
				})
			})
		}else{
			vscode.window.showInformationMessage('请选择theia_web_page项目进行打包');
		}
		
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
