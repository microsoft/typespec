model Task {
  name: string;
  description: string;
}
op doWork(task: Task): string;
op doMoreWork(task: Task): string;
