export default async (req, res) => {
    const url = 'https://api.github.com/users/rthazen/repos'
    const response = await fetch(url)
    const json = response.json()
    const numProjects: number = Object.keys(json).length
    return res.status(200).json({
        numProjects
    })
}