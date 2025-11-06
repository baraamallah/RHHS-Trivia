# تحدي الفرق – معلومات ودول وكرة قدم! (Arabic Team Strategy Trivia)

## 🎮 Game Overview

An interactive, colorful Arabic trivia game designed for team collaboration! This single-file HTML game features multiple rounds covering countries, football, general knowledge, and speed rounds, with a 30-second timer for each question.

## 🌟 Features

- **RTL Arabic Support**: Full right-to-left language support optimized for Arabic text
- **Team-Based Gameplay**: Two teams compete to answer questions collaboratively
- **4 Themed Rounds**:
  - 🌍 **Countries**: Capitals, flags, and landmarks
  - ⚽ **Football**: Teams, players, and World Cup facts
  - ❓ **Puzzles**: Logic puzzles and riddles
  - 🕒 **Speed**: Quick questions with short answers
- **30-Second Timer**: Visual countdown timer with warning effects
- **Scoring System**: Points for correct answers, bonus points for quick responses
- **Question Editor**: Built-in interface to add, edit, and customize questions
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Data Persistence**: Questions saved to browser local storage

## 🚀 How to Play

1. **Open the Game**: Simply open `index.html` in any modern web browser
2. **Enter Team Names**: Input names for both competing teams
3. **Read Instructions**: Learn about game rules and teamwork
4. **Play Through Rounds**: Each round contains 3-5 questions
5. **Answer Collaboratively**: Teams discuss and select answers together
6. **Winning Team**: Team with highest score wins!

## 🎯 Game Rules

- Each question has 30 seconds for team discussion
- Teams alternate answering questions
- Correct answer = 1 point
- Quick answer (under 10 seconds) = bonus point
- No penalties for wrong answers
- 4 rounds with different themes

## ⚙️ Technical Requirements

- **Browser**: Modern browsers (Chrome 60+, Firefox 55+, Safari 12+)
- **JavaScript**: Must be enabled
- **Resolution**: Works best on 1024x768 and higher
- **Storage**: Uses browser local storage for question persistence

## 📝 Question Editor

The game includes a built-in question editor accessible via the "تعديل الأسئلة" button:

- **Add Questions**: Create new questions for any category
- **Edit Questions**: Modify existing questions and answers
- **Delete Questions**: Remove unwanted questions
- **Import/Export**: Save question sets as JSON files
- **Reset Options**: Restore default question sets

## 🎨 Design Features

- **Glass Morphism**: Modern translucent design with backdrop blur effects
- **Gradient Animations**: Dynamic color transitions and glowing effects
- **Smooth Transitions**: Fluid animations between game states
- **Mobile Responsive**: Optimized layout for all screen sizes
- **Arabic Typography**: Clean, readable Arabic fonts throughout

## 📁 File Structure
Arabic_Trivia/
├── index.html # Main HTML structure and layout
├── styles.css # All CSS styling and animations
├── game.js # Game logic and functionality
├── questions.js # Questions database and management
└── README.md # This documentation
code
Code
### File Descriptions

- **index.html**: Clean HTML structure with semantic markup and accessibility features
- **styles.css**: Complete styling system with responsive design and animations
- **game.js**: Core game logic, state management, and user interactions
- **questions.js**: Question database with default questions and management functions

## 🔧 Deployment

### Local Development
1. Clone or download this repository
2. Ensure all files are in the same directory: `index.html`, `styles.css`, `game.js`, `questions.js`
3. Open `index.html` in your web browser
4. Start playing immediately!

### File Dependencies

The game requires all files to be present and properly linked:
index.html (main entry point)
├── links to: styles.css
├── loads: questions.js (first)
└── loads: game.js (second)
code
Code
### Development Notes

- **styles.css**: Contains all visual styles, animations, and responsive design
- **questions.js**: Must be loaded before `game.js` as it provides the question database
- **game.js**: Contains all game logic and uses questions from `questions.js`
- **Modular Design**: Easy to customize styles without touching game logic
- **Question Management**: Edit `questions.js` directly to add default questions

### Web Hosting
- **GitHub Pages**: Free static hosting
- **Netlify**: Drag-and-drop deployment
- **Vercel**: Zero-config deployment
- **Any static hosting service**: Works everywhere

### Server Option
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000```

## 🌐 Browser Compatibility

- ✅ Chrome (60+)
- ✅ Firefox (55+)
- ✅ Safari (12+)
- ✅ Edge (79+)
- ✅ Mobile Chrome (60+)
- ✅ Mobile Safari (12+)

## 📱 Mobile Features

- **Touch-Friendly**: Large tap targets and touch gestures
- **Responsive Layout**: Adapts to screen size
- **Orientation Support**: Works in portrait and landscape
- **Performance Optimized**: Fast loading and smooth animations

## 🔒 Privacy & Data

- **No Tracking**: No analytics or user tracking
- **Local Storage Only**: Questions saved locally in browser
- **Offline Play**: Works without internet connection after loading
- **No Server Required**: Completely client-side application

## 🎮 Educational Value

Perfect for:
- **Team Building**: Encourages collaboration and discussion
- **Educational Settings**: Classroom activities and learning
- **Family Game Night**: Fun for all ages
- **Cultural Exchange**: Learn about countries, sports, and general knowledge
- **Arabic Language Practice**: Improve Arabic reading and comprehension

## 🐛 Troubleshooting

**Timer Not Working?**
- Check that JavaScript is enabled
- Try refreshing the page
- Ensure browser supports modern JavaScript

**Questions Not Saving?**
- Check browser local storage permissions
- Clear browser cache and try again
- Try different browser if needed

**Layout Issues on Mobile?**
- Refresh the page
- Check device orientation
- Ensure mobile browser supports CSS Grid

## 📄 License

This project is open source and available under the MIT License.

---

**Made with ❤️ for team collaboration and fun learning!**