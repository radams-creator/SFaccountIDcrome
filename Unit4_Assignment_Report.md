# Programming Assignment Unit 4 - Stock Price Analysis

## Student Submission

### Objective
Create a Java program that processes daily stock prices using both an array and an `ArrayList`, and implements methods to:

1. Calculate average stock price.
2. Find maximum stock price.
3. Count occurrences of a specific stock price.
4. Compute cumulative sum of stock prices.

### Program Code
```java
import java.util.ArrayList;
import java.util.Arrays;

public class StockPriceAnalysis {

    public static double calculateAveragePrice(double[] prices) {
        double sum = 0.0;
        for (double price : prices) {
            sum += price;
        }
        return sum / prices.length;
    }

    public static double calculateAveragePrice(ArrayList<Double> prices) {
        double sum = 0.0;
        for (double price : prices) {
            sum += price;
        }
        return sum / prices.size();
    }

    public static double findMaximumPrice(double[] prices) {
        double max = prices[0];
        for (int i = 1; i < prices.length; i++) {
            if (prices[i] > max) {
                max = prices[i];
            }
        }
        return max;
    }

    public static double findMaximumPrice(ArrayList<Double> prices) {
        double max = prices.get(0);
        for (int i = 1; i < prices.size(); i++) {
            if (prices.get(i) > max) {
                max = prices.get(i);
            }
        }
        return max;
    }

    public static int countOccurrences(double[] prices, double targetPrice) {
        int count = 0;
        for (double price : prices) {
            if (price == targetPrice) {
                count++;
            }
        }
        return count;
    }

    public static ArrayList<Double> computeCumulativeSum(ArrayList<Double> prices) {
        ArrayList<Double> cumulative = new ArrayList<>();
        double runningSum = 0.0;

        for (double price : prices) {
            runningSum += price;
            cumulative.add(runningSum);
        }

        return cumulative;
    }

    public static void main(String[] args) {
        double[] stockArray = {101.5, 103.0, 99.8, 103.0, 105.2, 102.4, 103.0, 107.1, 104.6, 106.3};

        ArrayList<Double> stockList = new ArrayList<>(
            Arrays.asList(101.5, 103.0, 99.8, 103.0, 105.2, 102.4, 103.0, 107.1, 104.6, 106.3)
        );

        double averageArray = calculateAveragePrice(stockArray);
        double averageList = calculateAveragePrice(stockList);
        double maxArray = findMaximumPrice(stockArray);
        double maxList = findMaximumPrice(stockList);

        double targetPrice = 103.0;
        int occurrences = countOccurrences(stockArray, targetPrice);

        ArrayList<Double> cumulativeSum = computeCumulativeSum(stockList);

        System.out.println("Stock prices (Array): " + Arrays.toString(stockArray));
        System.out.println("Stock prices (ArrayList): " + stockList);
        System.out.println();
        System.out.println("Average price (Array): " + averageArray);
        System.out.println("Average price (ArrayList): " + averageList);
        System.out.println("Maximum price (Array): " + maxArray);
        System.out.println("Maximum price (ArrayList): " + maxList);
        System.out.println("Occurrences of " + targetPrice + " in Array: " + occurrences);
        System.out.println("Cumulative sum (ArrayList): " + cumulativeSum);
    }
}
```

### Explanation
- `calculateAveragePrice(...)` computes the average by summing all prices and dividing by the number of values.
- `findMaximumPrice(...)` loops through values and keeps track of the largest price found.
- `countOccurrences(...)` checks each element in the array and increments a counter when it equals the target price.
- `computeCumulativeSum(...)` builds a new `ArrayList` using a running sum at each index.

### Sample Output
```text
Stock prices (Array): [101.5, 103.0, 99.8, 103.0, 105.2, 102.4, 103.0, 107.1, 104.6, 106.3]
Stock prices (ArrayList): [101.5, 103.0, 99.8, 103.0, 105.2, 102.4, 103.0, 107.1, 104.6, 106.3]

Average price (Array): 103.59
Average price (ArrayList): 103.59
Maximum price (Array): 107.1
Maximum price (ArrayList): 107.1
Occurrences of 103.0 in Array: 3
Cumulative sum (ArrayList): [101.5, 204.5, 304.3, 407.3, 512.5, 614.9, 717.9, 825.0, 929.6, 1035.8999999999999]
```

### Conclusion
The program successfully implements all required methods for array and `ArrayList` processing and produces correct output for average, maximum, occurrences, and cumulative sum.
