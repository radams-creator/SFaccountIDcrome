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
