#include <Servo.h>

Servo myservo;
int currentAngle = 20;  // Keep track of the current position

void setup() {
  Serial.begin(9600);
  myservo.attach(9);
  delay(1000);

  myservo.write(currentAngle); // Start at 20°
  Serial.println("Servo initialized at 20°");
  Serial.println("Enter '0', '1', or '2' to move to preset positions.");
}

void moveServoSmoothly(int targetAngle, int delayPerStep = 15) {
  if (targetAngle == currentAngle) return;

  int step = (targetAngle > currentAngle) ? 1 : -1;
  for (int angle = currentAngle; angle != targetAngle; angle += step) {
    myservo.write(angle);
    delay(delayPerStep);
  }
  myservo.write(targetAngle);  // Ensure exact final position
  currentAngle = targetAngle;
}

void loop() {
  if (Serial.available()) {
    char input = Serial.read();

    if (input == '0') {
      moveServoSmoothly(0);
      Serial.println("Moved to 0°");
    } else if (input == '1') {
      moveServoSmoothly(60);
      Serial.println("Moved to 60° (Position 1)");
    } else if (input == '2') {
      moveServoSmoothly(180);
      Serial.println("Moved to 180° (Position 2)");
    } else if (input != '\r' && input != '\n') {
      Serial.print("Invalid input: ");
      Serial.println(input);
    }
  }
}