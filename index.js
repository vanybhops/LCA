import { spawn } from "child_process";
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

async function getConnectionData() {
  const data = spawn("wmic", [
    "process", "where", "name='LeagueClientUx.exe'", "get", "commandLine"
  ])
  let appPortPromise, authTokenPromise;
  const appPort = new Promise((resolve, reject) => { appPortPromise = resolve })
  const authToken = new Promise((resolve, reject) => { authTokenPromise = resolve })
  data.stdout.on("data", (data) => {
    const sData = data.toString()
    appPortPromise(String(sData.match(/(?<="--app-port=)[0-9]*/gm)))
    authTokenPromise(String(sData.match(/(?<="--remoting-auth-token=).*?(?=")/gm)))
  })
  return { appPort, authToken }
}

async function setStatus(status, appPort, authorizationToken) {
  return fetch(`https://127.0.0.1:${appPort}/lol-chat/v1/me`, {
    "headers": {
      "authorization": "Basic " + authorizationToken,
      "content-type": "application/json"
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": JSON.stringify(
      { "statusMessage": status }
    ),
    "method": "PUT",
    "mode": "cors",
    "credentials": "omit"
  }).then(async response => {
    console.log(await response.text())
  })
}

async function getAllFriends(appPort, authorizationToken) {
  return fetch(`https://127.0.0.1:${appPort}/lol-chat/v1/friends`, {
    "headers": {
      "authorization": "Basic " + authorizationToken,
      "content-type": "application/json"
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors",
    "credentials": "omit"
  }).then(async response => await response.json())
}
async function deleteFriend(friendPuuid, appPort, authorizationToken) {
  return fetch(`https://127.0.0.1:${appPort}/lol-chat/v1/friends/${friendPuuid}`, {
    "headers": {
      "authorization": "Basic " + authorizationToken,
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "DELETE",
    "mode": "cors",
    "credentials": "omit"
  }).then(async response => response.status)
}

async function friendsNuker(appPort, authorizationToken) {
  const allFriends = await getAllFriends(appPort, authorizationToken)
  for (const friend of allFriends) {
    await deleteFriend(friend.puuid, appPort, authorizationToken)
    await new Promise((resolve, reject) => setInterval(() => {resolve()}, 300))//sleeps for 300 ms
  }
  return console.log("done")
}

(async () => {
  const data = await getConnectionData()
  const appPort = await data.appPort
  const authToken = await data.authToken
  let authorizationToken = "riot:" + new Buffer.alloc(authToken.length, authToken, "ascii")
  authorizationToken = btoa(authorizationToken)
  await setStatus(`
              ⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀          
          ⠀⠀⠀⠀⠀⣠⣴⣾⣿⣿⣿⣿⣷⣦⣄⠀⠀⠀⠀⠀          
          ⠀⠀⢀⣴⣿⣿⣿⠟⠛⠛⠛⠛⠿⣿⣿⣿⣦⡀⠀⠀          
          ⠀⢠⣾⣿⣿⠟⠁⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⣷⡄⠀          
          ⢠⣿⣿⣿⠇⠀⠀⢠⣶⠀⠀⣶⡄⠀⠀⠹⣿⣿⣿⡄          
          ⣿⣿⡟⠁⠀⣀⣴⣿⡟⠀⠀⢻⣿⣦⣄⠀⠉⢻⣿⣿          
          ⣿⣿⡇⠀⠀⠿⠿⠟⠁⣰⣦⠈⠻⠿⠿⠀⠀⢸⣿⣿          
          ⣿⣿⣷⣄⡀⠀⠀⠀⠀⣉⣈⠀⠀⠀⠀⢀⣠⣾⣿⣿          
          ⢹⣿⣿⣿⣿⣆⠀⠀⢸⣿⣿⡇⠀⠀⣰⣿⣿⣿⣿⠏          
          ⠀⢻⣿⣿⣿⣿⡄⠀⠈⣿⣿⠁⠀⢠⣿⣿⣿⣿⡟⠀          
          ⠀⠈⢻⣿⣿⣿⣿⠀⠀⣿⣿⠀⢀⣿⣿⣿⣿⡟⠀⠀          
          ⠀⠀⠈⢻⣿⣿⣿⣧⠀⠸⠇⠀⣼⣿⣿⣿⠟⠀⠀⠀          
          ⠀⠀⠀⠀⠙⢿⣿⣿⣧⣤⣤⣾⣿⣿⡿⠋⠀⠀⠀⠀          
          ⠀⠀⠀⠀⠀⠀⠙⠿⣿⣿⣿⣿⠿⠋⠀⠀⠀⠀⠀⠀          
          ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀          
          made by vany

    `, appPort, authorizationToken)
  await friendsNuker(appPort, authorizationToken)
})()
