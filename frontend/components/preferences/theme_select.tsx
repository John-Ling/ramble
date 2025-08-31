"use client";




export default function ThemeSelect() { 

  function selectTheme(theme: string) {
    console.log("SEtting theme to ", theme);
    // format theme name into data-theme compatible format

    const formatted = theme.toLowerCase().replace(' ', '-');
    document.body.setAttribute("data-theme", formatted);
    localStorage.setItem("theme", formatted);
  }

  return (
  <>
      <div className="h-96 w-full grid grid-cols-3 grid-rows-3 gap-3">
        {availableThemes.map((swatch: ColourSwatch, i: number) => {
          return <ColourSwatch key={i} bgColour={swatch.bgColour} fgColour={swatch.fgColour} name={swatch.name}  on_click={selectTheme}/>
        })}  
      </div>
    </>
  )
}

interface ColourSwatchProps {
  bgColour: string;
  fgColour: string;
  name: string;
  on_click: (name: string) => void;
}

function ColourSwatch({bgColour, fgColour, name, on_click}: ColourSwatchProps) {
  return (
    <>
      <button onClick={(e) => {e.preventDefault(); on_click(name)}} className="p-5 flex items-center justify-center hover:cursor-pointer" style={{"background": `#${bgColour}`}}>
        <p className="font-bold text-lg lg:text-2xl select-none" style={{"color": `#${fgColour}`}}>{name}</p>
      </button>
    </>
  )
}


interface ColourSwatch  {
  bgColour: string;
  fgColour: string;
  name: string;
}

const availableThemes: ColourSwatch[] = [
  {
    bgColour: "fafafa",
    fgColour: "0a0a0a",
    name: "Light",
  },
  {
    bgColour: "0a0a0a",
    fgColour: "fafafa",
    name: "Dark",
  },
  {
    bgColour: "2e3440",
    fgColour: "d8dee9",
    name: "Nord",
  },
  {
    bgColour: "272822",
    fgColour: "f8f8f2",
    name: "Monokai",
  },
  {
    bgColour: "fafafa",
    fgColour: "383a42",
    name: "Atom Light"
  },
  {
    bgColour: "282c34",
    fgColour: "abb2bf",
    name: "Atom Dark"
  },
  {
    bgColour: "1a1b26",
    fgColour: "c0caf5",
    name: "Tokyo Night"
  },
  {
    bgColour: "282a36",
    fgColour: "f8f8f2",
    name: "Dracula"
  },
  {
    bgColour: "002b36",
    fgColour: "fdf6e3",
    name: "Solarised Dark"
  },
  {
    bgColour: "fdf6e3",
    fgColour: "002b36",
    name: "Solarised Light"
  },
  {
    bgColour: "1e1e2e",
    fgColour: "cdd6f4",
    name: "Catppuccin"
  },
  {
    bgColour: "282828",
    fgColour: "ebdbb2",
    name: "Gruvbox"
  },
  {
    bgColour: "f1eadc",
    fgColour: "5c6a72",
    name: "Everforest Light"
  },
  {
    bgColour: "2d353b",
    fgColour: "d3c6aa",
    name: "Everforest Dark"
  },
  
]