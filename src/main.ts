import * as core from '@actions/core'
import * as fs from 'fs'
import FormData from 'form-data'

// import { wait } from './wait'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const filePath = core.getInput('file', { required: true })
    const projectUrl = core.getInput('project', { required: true })
    const globalIdStr = core.getInput('id', { required: true })

    const [tenant, workspace, project] = projectUrl.split('/')

    core.debug(
      `Calling with T:${tenant}, W:${workspace}, P:${project} for file ${filePath} and global ID ${globalIdStr} ...`
    )

    // Check if globalId is a positive integer
    if (!/^\d+$/.test(globalIdStr)) {
      core.setFailed(`Invalid global ID: ${globalIdStr}`)
      return
    }

    const globalId = parseInt(globalIdStr, 10)

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      core.setFailed(`File not found: ${filePath}`)
      return
    }

    const idToken = await core.getIDToken()

    core.info(`${filePath}, ${projectUrl}, ${globalId}, ${idToken}`)

    const url = `https://api.nemasystems.com/api/${tenant}/${workspace}/${project}/artifacts/apps/${globalId}`

    const formData = new FormData()

    const fileContent = fs.createReadStream(filePath)

    formData.append('file', fileContent, { filename: filePath })

    // submit file to nemasystems
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    })

    core.info(`Response: ${response.status}`)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
