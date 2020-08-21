const core = require('@actions/core')
const github = require('@actions/github')

run()

async function run() {

    try {

        const api = github.getOctokit(core.getInput("GITHUB_TOKEN", { required: true }), {})

        const organization = core.getInput("organization") || context.repo.owner
        const login = core.getInput("login")
        const team = core.getInput("team")

        console.log(`Getting teams for ${login} in org ${organization}. Will check if belongs to ${team}`)

        //TODO: add pagination
        const query = `query  {
            organization(login: "${organization}") {      
            teams (first:100,userLogins: ["${login}"]) { 
                totalCount            
                nodes {
                name
                }
                pageInfo {
                    hasNextPage
                    startCursor
                    endCursor
                }        
            }
            }
        }`

        console.log(`DBG QUERY ${query}`)

        let org = await api.graphql(query)

        console.log(`DBG ${JSON.stringify(org)}`)

        let teams = []
        let isTeamMember = false

        for (let x = 0; x < org.organization.teams.nodes.length; x++) {
            const node = org.organization.teams.nodes[x]

            console.log("DBG look ${node.name}")

            teams.push(node.name)

            if (team) {
                if (team.toLowerCase() === node.name.toLowerCase()) {
                    isTeamMember = true
                }
            }
        }

        console.log(`DBG teams ${teams.join(",")}`)        
        console.log(`DBG isTeamMember ${isTeamMember}`)

        core.setOutput("teams", teams)
        core.setOutput("isTeamMember", isTeamMember)

    } catch (error) {
        core.setFailed(error.message)
    }
}