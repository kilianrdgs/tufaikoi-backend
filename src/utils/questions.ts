export function getRandomStarterScenario(): string {
	const randomIndex = Math.floor(Math.random() * STARTER_SCENARIOS.length);
	return STARTER_SCENARIOS[randomIndex] as string;
}

// remplacer ici par plus tard une vraie db pour injecter facilement des nouvelles questions de base

const STARTER_SCENARIOS: string[] = [
	"Tu trouves un portefeuille contenant 500€ dans le métro. À l'intérieur, une photo d'un gamin avec écrit \"Pour l'opération de Timmy\" au dos.",
	"Tu es dans l'ascenseur avec ton grand patron. Il pète. C'est clairement lui. Il te regarde droit dans les yeux en fronçant les sourcils comme si c'était toi.",
	"Tu manges un sandwich en marchant dans la rue. Un pigeon fonce sur toi, t'arrache un morceau de pain et te chie dessus en repartant.",
	"Tu es aux toilettes publiques d'un centre commercial. Tu réalises qu'il n'y a plus de papier et tu entends quelqu'un entrer dans les toilettes d'à côté.",
	"Tu es en speed dating. La personne en face de toi a un bout de salade coincé entre les dents depuis 10 minutes et te sourit énormément.",
	"Tu es à la salle de sport sur le tapis de course. Ton short se déchire complètement à l'arrière devant 20 personnes qui font du vélo face à toi.",
	"Tu te réveilles après une soirée. Tu as 47 messages non lus dans un groupe intitulé 'Soirée de OUF hier' dont tu ne te souviens pas.",
	"Tu ramènes quelqu'un chez toi après une soirée. En ouvrant la porte, ton chat a déposé un rat mort pile sur le paillasson et vous regarde tous les deux fièrement.",
	"Tu vomis dans l'Uber après une soirée trop arrosée. Le chauffeur pilait pile à un feu rouge, ça a giclé partout sur le siège avant et sur lui.",
	"Tu prends une douche chez ton nouveau crush. Tu bouches complètement les toilettes. L'eau monte dangereusement et passe par-dessus. Il frappe : 'Ça va ?'.",
	"Tu es aux urgences avec un objet coincé dans un endroit gênant. L'interne qui arrive pour t'examiner est ton voisin de palier que tu croises tous les matins dans l'ascenseur.",
	"Tu es en visio importante avec ton équipe. Tu crois avoir coupé ton micro et tu commences à engueuler ton chat qui vient de renverser ton café. Tout le monde t'a entendu.",
	"Tu arrives à un premier rendez-vous Tinder. La personne te regarde bizarrement et dit 'Ah... les photos dataient un peu non ?' puis hésite visiblement à partir.",
	"Tu es au supermarché. Le détecteur antivol sonne. Le vigile te fouille devant 30 personnes. Il sort de ton sac un paquet de préservatifs et une courge que tu as complètement oubliés de scanner.",
	"Tu fais un jogging matinal. Tu pètes en croisant quelqu'un. C'était pas discret. Vous vous regardez. C'est ton nouveau collègue qui commence aujourd'hui.",
	"Tu es chez le dentiste. Il commence à te parler de sa vie perso pendant qu'il a les mains dans ta bouche. Il attend clairement une réponse de ta part.",
	"Tu envoies un vocal rageux sur ta belle-mère à ton pote. Tu réalises 3 secondes après l'avoir envoyé que c'est parti dans le groupe de famille. Elle a déjà écouté.",
	"Tu es en entretien d'embauche. Ton ventre gargouille comme un moteur diesel pendant 45 secondes non-stop dans un silence total. Le recruteur te fixe sans rien dire.",
	"Tu rentres chez toi après 3 jours d'absence. Ton frigo a lâché. L'odeur est apocalyptique et a contaminé tous tes vêtements. Tu as un mariage dans 2 heures.",
	"Tu es en train de mater une série sur ton phone dans le métro bondé. Une scène de sexe ultra explicite commence à fond sonore. Ton téléphone bug et refuse de se mettre en pause.",
	"Tu arrives en sueur à un entretien important. En serrant la main du recruteur, tu réalises que ton déo a complètement lâché et que tu pues comme un vestiaire de rugby.",
	"Tu es en réunion Zoom. Tu te lèves pour aller chercher un truc en pensant avoir coupé la caméra. Tu es en caleçon Mickey. Tout le monde te mate en silence.",
	"Tu fais la bise à quelqu'un lors d'une soirée networking. Vous partez pas du même côté. Vous vous clashés les dents violemment. Ça fait un bruit sec. Tout le monde s'est retourné.",
	"Tu paies tes courses au supermarché. Ta carte est refusée 3 fois. Il y a 8 personnes derrière toi qui soufflent. La caissière appelle son manager au micro dans tout le magasin.",
	"Tu racontes une blague salace à table en soirée. Personne ne rit. Un blanc de 10 secondes. Quelqu'un dit 'Bon... quelqu'un veut du pain ?'",
	"Tu es à la plage. Une vague t'arrache ton maillot de bain. Tu es à 50 mètres du rivage. Des familles avec des enfants partout. Ton maillot flotte au loin.",
	"Tu es en afterwork avec des collègues. Tu racontes une anecdote sur 'ce connard de client'. Quelqu'un te coupe : 'Euh... il est juste derrière toi'. Il t'a tout entendu.",
	"Tu es coincé dans les embouteillages. Envie de chier critique. Tu te gares en urgence derrière un buisson. Une classe de primaire en sortie passe. Tous te voient accroupi.",
	"Ton chat vient de vomir sur ton clavier pendant ta réunion Zoom. Tout le monde a vu et attend ta réaction.",
	"Tu es à un mariage chic. La mariée vient de lancer son bouquet et il atterrit directement dans ton assiette de tiramisu.",
	"Tu es aux urgences pour une intoxication alimentaire. Tu vomis dans la poubelle de la salle d'attente. Elle était déjà pleine. Ça déborde par terre.",
	"Tu es témoin à un mariage. Pendant ton discours émouvant, tu reçois une notification Tinder bien audible. Tout le monde a entendu. La mariée te fusille du regard.",
	"Tu fais du bénévolat dans une maison de retraite. Tu renverses ton café sur un vieux monsieur en fauteuil roulant. Tout le monde te regarde horrifié.",
];
