import React from 'react'
import useSWR, { Key, Fetcher } from 'swr'

const fetcher: Fetcher<string> = (args) => fetch(args).then((res) => res.json())

interface GithubAPI {
    numberProject: number
}

const Projects = () => {
    const { data, error } = useSWR('/api/github', fetcher)
    console.log('data', data);
    // const numberProject: number = data?.numProjects
    return (
        <div>
            <h1>Github Projects</h1>
        </div>
    )
}

export default Projects