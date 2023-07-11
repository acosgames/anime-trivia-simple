
let categories = [
    {
        "id": "aa",
        "name": "History",
        "color": "#e6c642"
    },
    {
        "id": "ac",
        "name": "Technology",
        "color": "#685af5"
    },
    {
        "id": "ad",
        "name": "Geography",
        "color": "#3ce956"
    },
    {
        "id": "ae",
        "name": "Art",
        "color": "#307de7"
    },
    {
        "id": "af",
        "name": "Space",
        "color": "#a656fd"
    },
    {
        "id": "ah",
        "name": "Science",
        "color": "#e857ed"
    },
    {
        "id": "ag",
        "name": "General culture",
        "color": "#56cfef"
    }
]



export default function GameTitle(props) {

    function handleTitleHover(e) {
        e.target.classList.add('jello-vertical')
        e.target.style.color = categories[Math.floor(Math.random() * categories.length)].color
        e.target.addEventListener('animationend', () => e.target.classList.remove('jello-vertical'))
    }

    const handleTitleLeave = (e) => (e.target.style.color = 'white')

    return (
        <div id="game-title-container">
            <div id="game-title">
                <h1>{'Anime'.split('').map((letter, index) => (
                    <span key={index} id={letter + index + 10} className='game-title-letter' onMouseEnter={handleTitleHover} onMouseLeave={handleTitleLeave}>
                        {letter}
                    </span>
                ))}</h1>
                <h1>
                    {'Trivia'.split('').map((letter, index) => (
                        <span key={index} id={letter + index + 10} className='game-title-letter' onMouseEnter={handleTitleHover} onMouseLeave={handleTitleLeave}>
                            {letter}
                        </span>
                    ))}
                </h1>
            </div>
        </div>

    )
}