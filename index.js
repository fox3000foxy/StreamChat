const Discord = require('discord.js')
const fetch = require('node-fetch');
const { parser, htmlOutput, toHTML } = require('discord-markdown');
const client = new Discord.Client()
const port = 8080
// console.clear()

client.on('ready',()=>{
	const express = require('express')
	const cors = require('cors')
	const app = express()
	const http = require('http');
	const server = http.createServer(app);
	const { Server } = require("socket.io");
	const io = new Server(server);
	client.on('message',(msg)=>{
		io.emit('message',msg)
	})
	app.use(cors())
	app.get('/api',async (req,res)=>{
		let messagesArray = new Array()
		let channel = client.channels.cache.get(req.query.channel)
		await channel.messages.fetch({
		   limit: 100,
		}).then((messages) => {
			// console.log(messages)
			messages.forEach((message)=>{
				//color
				let color;
				if(message.member!=null) color = message.member.displayHexColor
				else color = "#ffffff"
				let {author,id} = message
				let content = toHTML(message.content,  {
					discordCallback: {
						user: node => `<mention class="mention wrapper-3WhCwL mention interactive">@${client.users.cache.get(node.id).username}</mention>`
					}
				})
				if(content=='') content = toHTML("`[Attachement]`")
				let formatted = `
					<message id="${id}">
						<span style="color:${color}">${author.username}:</span>
						<span style="color:white">${content}</span>
						<br>
					</message>
				`
				messagesArray.push({
					color,content,author,id,formatted
				})
			})
		});
		res.send(messagesArray)
	})
	app.get('/',(req,res)=>{res.sendFile(__dirname+"/src/index.html")})
	app.get('/login', async ({ query }, response) => {
		const { code } = query;

		if (code) {
			try {
				const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
					method: 'POST',
					body: new URLSearchParams({
						client_id: '924278077087948840',
						client_secret: 'aUHluoXujoRXwB4bWEXM0Z4bA6VPx6TW',
						code,
						grant_type: 'authorization_code',
						redirect_uri: `http://localhost:${port}/login`,
						scope: 'identify',
					}),
					headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				});

				const oauthData = await oauthResult.json();
				const userResult = await fetch('https://discord.com/api/users/@me', {
					headers: {
						authorization: `${oauthData.token_type} ${oauthData.access_token}`,
					},
				});

				await userResult.json().then((res)=>{
					if(res.message) response.redirect('/')
					else response.send(`
						<script>
							localStorage.setItem('credentials','${JSON.stringify(res)}')
							location.href='/'
						</script>
					`)
				})
			} catch (error) {console.error(error);}
		}else{response.redirect('/')}
	})
	app.get('/sendMessage',async (req,res)=>{
		const channel = client.channels.cache.get(req.query.channel)
		const webhooks = await channel.fetchWebhooks();
		let webhook = webhooks.find(wh => wh.token);
		if (!webhook) {
			channel.createWebhook('StreamWebhook').then(webhookCreated => {
				webhook = webhookCreated
			})
		}
		await webhook.send({
			content: req.query.content,
			username: req.query.username,
			avatarURL: req.query.avatarURL
		});
		res.send("ok")
	})

	server.listen(port)
	console.log(client.user.username+"#"+client.user.discriminator,"is ready")
})
client.login('OTA0NzEzMDk1MDE0OTIwMjEz.YX_hug.hRrcRNpzwEIryJSTl_92xvDSeKE')