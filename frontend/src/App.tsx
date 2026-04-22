import { MyToastRegion, queue } from './components/Toast/Toast'
import Button from './components/Button/Button'

function App() {
  return (
    <div>
      <h1>Hello world</h1>

      <Button
        onPress={() =>
          queue.add({
            title: 'Info',
            description: 'This is info',
            type: 'info',
            timeout: 5000,
          })
        }
      >
        Show Info Toast
      </Button>

      <Button
        onPress={() =>
          queue.add({
            title: 'Success',
            description: 'Success!',
            type: 'positive',
            timeout: 5000,
          })
        }
      >
        Show Success Toast
      </Button>

      <Button
        onPress={() =>
          queue.add({
            title: 'Error',
            description: 'Error occurred',
            type: 'negative',
            timeout: 7000,
          })
        }
      >
        Show Error Toast
      </Button>

      <Button
        onPress={() =>
          queue.add({
            title: 'Warning',
            description: 'Warning',
            type: 'warning',
            timeout: 6000,
          })
        }
      >
        Show Warning Toast
      </Button>

      <MyToastRegion />
    </div>
  )
}

export default App