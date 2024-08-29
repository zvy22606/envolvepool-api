import { URLSearchParams } from 'url'
import _ from 'lodash'
import config from 'config'
import Bluebird from 'bluebird'
import axios, { AxiosInstance, AxiosResponse } from 'axios'

class GithubThirdparty {
  private api: AxiosInstance
  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
  }
  async getAccessTokenFromCode(code: string): Promise<string> {
    const { data } = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.get('oauth.github.clientId'),
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        // client_id: 'b02759d40af56d15400d',
        // client_secret: 'bebb662e6cda3aeebe952ce04151d63b3e86b5ab',
        code
      }
    )
    const params = new URLSearchParams(data)

    return params.get('access_token') as string
  }

  async getConnectAccessTokenFromCode(code: string): Promise<string> {
    const { data } = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.get('oauth.github.connect.clientId'),
        client_secret: process.env.GITHUB_CONNECT_CLIENT_SECRET,
        code
      }
    )
    const params = new URLSearchParams(data)

    return params.get('access_token') as string
  }

  async getUserData(accessToken: string): Promise<any> {
    const { data } = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`
      }
    })

    return _.pick(data, [
      'id',
      'name',
      'login',
      'email',
      'avatar_url',
      'followers'
    ])
  }

  async getGithubApi(url: string, accessToken: string): Promise<any> {
    const { data } = await this.api.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    return data
  }

  async getRepos(username: string, accessToken: string): Promise<any> {
    // const { data } = await this.api.get(`/users/${username}/repos?type=all`, {
    const { data } = await this.api.get(`/user/repos?visibility=all`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    if (data.message) {
      return []
    }
    return Bluebird.mapSeries(data, async (repo: any) => {
      const languages = await this.getGithubApi(repo.languages_url, accessToken)
      const totalCommit = await this.getCommitCount(
        username,
        repo.name,
        accessToken
      )
      const totalPr = await this.getPrCount(username, repo.name, accessToken)
      const totalIssue = await this.getIssuesCount(
        username,
        repo.name,
        accessToken
      )
      const totalContributor = await this.getUserContributedRepos(
        username,
        accessToken
      )
      // let contributors = await this.getContributors(
      //   repo.owner.login,
      //   repo.name,
      //   accessToken
      // )
      // contributors = _.filter(contributors, { login: username })
      // const totalContributor = _.sumBy(contributors, 'contributions')

      return {
        language: languages,
        totalStar: repo.stargazers_count,
        totalFork: repo.forks_count,
        totalCommit,
        totalPr,
        totalIssue,
        totalContributor
      }
    })
  }

  formatGithubActivity(repos: any[]): any {
    const activity = {
      totalStar: _.sumBy(repos, 'totalStar'),
      totalFork: _.sumBy(repos, 'totalFork'),
      totalContributor: _.sumBy(repos, 'totalContributor'),
      totalCommit: _.sumBy(repos, 'totalCommit'),
      totalPr: _.sumBy(repos, 'totalPr'),
      totalIssue: _.sumBy(repos, 'totalIssue'),
      languages: {}
    }
    const languages = {}
    repos.forEach((repo) => {
      _.forOwn(repo.language, (v: number, k: string) => {
        if (languages[k]) {
          languages[k] += v
        } else {
          languages[k] = v
        }
      })
    })
    activity.languages = languages

    return activity
  }

  async getUserContributedRepos(username: string, accessToken: string) {
    let page: number = 1
    let contributedRepos = new Set()

    try {
      while (true) {
        const response = await axios.get(`/users/${username}/events/public`, {
          params: { per_page: 100, page: page },
          headers: { Authorization: `Bearer ${accessToken}` }
        })

        if (response.status !== 200) {
          throw new Error(`Failed to fetch events: ${response.status}`)
        }

        const events = response.data
        if (events.length === 0) {
          break
        }

        for (const event of events) {
          if (
            event.type === 'PushEvent' ||
            event.type === 'PullRequestEvent' ||
            event.type === 'IssuesEvent'
          ) {
            contributedRepos.add(event.repo.name)
          }
        }

        page += 1
      }

      return contributedRepos.size
    } catch (error: any) {
      console.error(error.message)
      return 0
    }
  }

  async getPrCount(
    username: string,
    repo: string,
    accessToken: string
  ): Promise<number> {
    try {
      const response = await this.api.get(`/repos/${username}/${repo}/pulls`, {
        params: { per_page: 1, page: 1 },
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      if (response.status !== 200) {
        throw new Error(`Failed to fetch commits: ${response.status}`)
      }

      return this.getCountByHeader(response)
    } catch (error: any) {
      console.error(error.message)
      return 0
    }
  }

  async getIssuesCount(
    username: string,
    repo: string,
    accessToken: string
  ): Promise<number> {
    try {
      const response = await this.api.get(`/repos/${username}/${repo}/issues`, {
        params: { per_page: 1, page: 1 },
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      if (response.status !== 200) {
        throw new Error(`Failed to fetch commits: ${response.status}`)
      }

      return this.getCountByHeader(response)
    } catch (error) {
      console.error(error)
      return 0
    }
  }

  async getCommitCount(
    username: string,
    repo: string,
    accessToken: string
  ): Promise<number> {
    try {
      const response = await this.api.get(
        `/repos/${username}/${repo}/commits`,
        {
          params: { per_page: 1, page: 1 },
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )

      if (response.status !== 200) {
        throw new Error(`Failed to fetch commits: ${response.status}`)
      }

      return this.getCountByHeader(response)
    } catch (error: any) {
      console.error(error.message)
      return 0
    }
  }

  async getCommits(
    username: string,
    reponame: string,
    accessToken: string,
    page?: number
  ): Promise<any[]> {
    page = page || 1
    const pageSize: number = 100

    const { data }: { data: any[] } = await this.api.get(
      `/repos/${username}/${reponame}/commits?per_page=${pageSize}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )
    if (data.length < pageSize) {
      return data
    }
    const ret = await this.getCommits(username, reponame, accessToken, page + 1)
    data.push(...ret)
    if (ret.length < pageSize) {
      return data
    }
    return data
  }

  async getContributors(
    username: string,
    reponame: string,
    accessToken: string,
    page?: number
  ): Promise<any[]> {
    page = page || 1
    const pageSize: number = 100

    const { data }: { data: any[] } = await this.api.get(
      `/repos/${username}/${reponame}/contributors?per_page=${pageSize}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )
    if (data.length < pageSize) {
      return data
    }
    const ret = await this.getContributors(
      username,
      reponame,
      accessToken,
      page + 1
    )
    data.push(...ret)
    if (ret.length < pageSize) {
      return data
    }
    return data
  }

  getCountByHeader(response: AxiosResponse) {
    let totalPages: number = 1
    if (response.headers.link) {
      const links: string[] = response.headers.link.split(',')
      const lastLink = links.find((link) => link.includes('rel="last"'))

      if (lastLink) {
        const lastUrl = lastLink
          .split(';')[0]
          .replace('<', '')
          .replace('>', '')
          .trim()
        const urlParams = new URLSearchParams(lastUrl.split('?')[1])
        totalPages = Number(urlParams.get('page')) || 0
      }
    }
    return totalPages
  }
}

export default new GithubThirdparty()
