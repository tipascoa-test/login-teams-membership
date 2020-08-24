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
        const query = `query($cursor: String, $org: String!, $userLogins: [String!])  {
            organization(login: $org) {      
              teams (first:100, userLogins: $userLogins, after: $cursor) { 
                totalCount            
                  nodes {
                    name
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }        
              }
            }
        }`

        // TODO: optimize to avoid 2 loops
        let cursor = null
        let org
        let teamResult = []
        do {
            org = await api.graphql(query, {
                "cursor": cursor,
                "org" : organization,
                "userLogins" : [login]
            })
            
            teamResult = teamResult.concat(org.organization.teams.nodes)
            cursor = org.organization.teams.pageInfo.endCursor   

        } while (org.organization.teams.pageInfo.hasNextPage)

        let teams = []
        let isTeamMember = false

        for (let x = 0; x < teamResult.length; x++) {
            const node = teamResult[x]

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