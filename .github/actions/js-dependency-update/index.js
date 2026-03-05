
const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

const setupGit = async () =>{
    await exec.exec('git config --global user.name "gh-automation"');
    await exec.exec('git config --global user.email "gh-automation@mail.com"');
};

const validateBranchName = ({branchName}) => /^[a-zA-Z0-9_\-\.\/]+$/.test(branchName)
const validateDirectoryName = ({dirName}) => /^[a-zA-Z0-9_\-\/]+$/.test(dirName)

const  setupLogger = ({debug, prefix} = {debug: false, prefix: ''}) => ({

    debug: (message) => {
        if(debug){
            // using core.debug requires to sue debug parameter on the repo
            // core.debug(`${prefix}${prefix ? ' : ' : ''}${message}`);
            core.info(`DEBUG ${prefix}${prefix ? ' : ' : ''}${message}`);
            // extend logging functionality
        }
    },

    error: (message) => { 
        core.error(`${prefix}${prefix ? ' : ' : ''}${message}`);
    },

    info: (message) => {
        core.info(`${prefix}${prefix ? ' : ' : ''}${message}`);
    },
});

async function run() {

    const baseBranch = core.getInput('base-branch', {required: true});
    const headBranch = core.getInput('head-branch', {required: true});
    // const targetBranch = core.getInput('target-branch', {required: true});
    // const headBranch = core.getInput('head-branch') || targetBranch;
    const ghToken = core.getInput('gh-token', {required: true});
    const workingDir = core.getInput('working-directory', {required: true});
    const debug = core.getInput('debug');
    const logger = setupLogger({debug, prefix: '[js-dependency-update]'});
    const commonExecOpts =  {
        cwd: workingDir
    };

    core.setSecret(ghToken)
    logger.debug('Validating inputs - base-branch, head-branch, working-drectory');
    if(!validateBranchName({branchName: baseBranch})){
        // core.error('Invalid base-branch name. Branch names should include only charcters, numbers, hyphens, underscores, dots and forward slashes.')
        core.setFailed('Invalid base-branch name. Branch names should include only charcters, numbers, hyphens, underscores, dots and forward slashes.');
        return;
    }


    if(!validateBranchName({branchName: headBranch})){
        // core.error('Invalid head-branch name. Branch names should include only charcters, numbers, hyphens, underscores, dots and forward slashes.')
        core.setFailed('Invalid head-branch name. Branch names should include only charcters, numbers, hyphens, underscores, dots and forward slashes.');
        return;
    }

    if(!validateDirectoryName({dirName: workingDir})){
        // core.error('Invalid working directory name. Branch names should include only charcters, numbers, hyphens, underscores and forward slashes.')
        core.setFailed('Invalid working directory name. Branch names should include only charcters, numbers, hyphens, underscores and forward slashes.');
        return;
    }

    logger.debug(`Base-branch is ${baseBranch}`);
    logger.debug(`Target-branch is ${headBranch}`);
    logger.debug(`Working directory is ${workingDir}`);

    logger.debug(`Checking for package updates.`);

    await exec.exec('npm update', [], {
        ...commonExecOpts
    });

    const gitStatus = await exec.getExecOutput('git status -s package*.json', [], {
        ...commonExecOpts
    });

    if (gitStatus.stdout.length > 0){
        logger.debug('There are updates available!');
        logger.debug('Setting up git.');

        await setupGit();
        logger.debug('Commiting and pushing package*.json changes.');
        
        await exec.exec(`git checkout -b ${headBranch}`, [],{
            ...commonExecOpts,
        });
        await exec.exec(`git add package.json package-lock.json`, [],{
            ...commonExecOpts,
        });
        await exec.exec(`git commit -m "chore: update dependencies"`, [],{
            ...commonExecOpts,
        });
        await exec.exec(`git push -u origin ${headBranch} --force`, [],{
            ...commonExecOpts,
        });

        logger.debug(`Creating PR using head branch ${headBranch}`);
        const octokit = github.getOctokit(ghToken);
        try {
            logger.debug('Fetching octokit API');

            await octokit.rest.pulls.create({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                title: 'Update NPM dependencies',
                body: 'This pull request updates NPM packgages',
                base: baseBranch,
                head: headBranch, 
            });
        } catch (e) {
            logger.error('[Something went wrong while creating the PR. Check the logs below.');
            core.setFailed(e.message);
            logger.error(e);
        }
    }
    else{
        logger.info('No updates at this point in time.');
    }

    /*
    1. Parse inputs:
        1.1. base-branch from which to check the updates
        1.2. head-branch to use to create the PR
        1.3. Github Token for authentication purposes (to create PRs)
        1.4. Working directory for which to check for dependencies
    2. Execute the npm update command within the working directory
        npx npm-check-updates
    3. Check whether there are modified package*.json files
    4. If there are modified files:
        4.1. Add and commit files to the head-branch
        4.2. Create a PR to the base-branch using octokit API
    5. Otherwise, conclude the custom action
    */

    // core.info('I am custom JS action');
}

run()